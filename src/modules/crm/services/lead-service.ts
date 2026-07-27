/**
 * PMN ERP Platform - Lead Service
 * 
 * Business logic layer for Lead management.
 * Implements service layer pattern with clean separation from controllers and repositories.
 */

import { leadRepository, type PaginationOptions, type PaginatedResult } from '../repositories/lead-repository';
import { activityRepository } from '../repositories/activity-repository';
import { publish } from '@/kernel/events/event-bus';
import { getConfig } from '@/kernel/config/config-loader';
import type { Lead } from '@/db/schema';
import type {
  CreateLeadInput,
  UpdateLeadInput,
  LeadFilters,
  LeadSortOptions,
  LeadStatus,
  LeadStage,
  LeadCreatedEvent,
  LeadAssignedEvent,
  LeadStatusChangedEvent,
  LeadConvertedEvent,
  LeadLostEvent,
} from '../types';

interface StatusTransitions {
  [key: string]: string[];
}

interface StatusConfig {
  id: string;
  name: string;
  isFinal?: boolean;
}

/**
 * Lead Service - Handles all lead-related business logic
 */
export class LeadService {
  /**
   * Create a new lead
   * Implements Stage 1 - Lead Capture with minimal friction
   */
  async createLead(input: CreateLeadInput, createdBy?: string): Promise<Lead> {
    // Validate mobile number uniqueness
    const existingLead = await leadRepository.findByMobile(input.mobileNumber);
    if (existingLead) {
      throw new Error(`A lead with mobile number ${input.mobileNumber} already exists`);
    }

    // Create the lead
    const lead = await leadRepository.create({
      fullName: input.fullName,
      mobileNumber: input.mobileNumber,
      email: input.email,
      leadSource: input.leadSource,
      interestedCourse: input.interestedCourse,
      preferredLanguage: input.preferredLanguage ?? 'english',
      city: input.city,
      consentToContact: input.consentToContact,
      notes: input.notes,
      assignedTo: input.assignedTo,
      status: input.assignedTo ? 'assigned' : 'new',
      stage: 'stage_1',
      createdBy,
    });

    // Log activity
    await activityRepository.create({
      leadId: lead.id,
      type: 'lead_created',
      title: 'Lead Created',
      description: `New lead from ${input.leadSource}`,
      metadata: { source: input.leadSource, course: input.interestedCourse },
      createdBy,
    });

    // Publish event
    await publish<LeadCreatedEvent>(
      'crm.lead.created',
      {
        leadId: lead.id,
        leadSource: input.leadSource,
        interestedCourse: input.interestedCourse,
        createdBy,
      },
      'crm'
    );

    return lead;
  }

  /**
   * Get a lead by ID
   */
  async getLeadById(id: string) {
    const lead = await leadRepository.findByIdWithRelations(id);
    if (!lead) {
      throw new Error(`Lead with ID ${id} not found`);
    }
    return lead;
  }

  /**
   * Get all leads with filtering and pagination
   */
  async getLeads(
    filters: LeadFilters = {},
    sort: LeadSortOptions = { field: 'createdAt', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ) {
    return leadRepository.findAll(filters, sort, pagination);
  }

  /**
   * Update a lead
   */
  async updateLead(id: string, input: UpdateLeadInput, updatedBy?: string): Promise<Lead> {
    const existingLead = await leadRepository.findById(id);
    if (!existingLead) {
      throw new Error(`Lead with ID ${id} not found`);
    }

    // Handle status change
    if (input.status && input.status !== existingLead.status) {
      await this.validateStatusTransition(existingLead.status, input.status);
    }

    // Update the lead
    const lead = await leadRepository.update(id, input);
    if (!lead) {
      throw new Error(`Failed to update lead ${id}`);
    }

    // Log activity
    await activityRepository.create({
      leadId: id,
      type: 'lead_updated',
      title: 'Lead Updated',
      description: 'Lead information was updated',
      metadata: { changes: Object.keys(input) },
      createdBy: updatedBy,
    });

    return lead;
  }

  /**
   * Update lead status
   */
  async updateStatus(
    id: string,
    newStatus: LeadStatus,
    updatedBy: string,
    reason?: string
  ): Promise<Lead> {
    const lead = await leadRepository.findById(id);
    if (!lead) {
      throw new Error(`Lead with ID ${id} not found`);
    }

    const previousStatus = lead.status;
    await this.validateStatusTransition(previousStatus, newStatus);

    const updatedLead = await leadRepository.updateStatus(id, newStatus, reason);
    if (!updatedLead) {
      throw new Error(`Failed to update status for lead ${id}`);
    }

    // Log activity
    await activityRepository.create({
      leadId: id,
      type: 'status_changed',
      title: 'Status Changed',
      description: `Status changed from ${previousStatus} to ${newStatus}`,
      metadata: { previousStatus, newStatus, reason },
      createdBy: updatedBy,
    });

    // Publish status change event
    await publish<LeadStatusChangedEvent>(
      'crm.lead.status_changed',
      {
        leadId: id,
        previousStatus,
        newStatus,
        changedBy: updatedBy,
        reason,
      },
      'crm'
    );

    // Publish specific events for important status changes
    if (newStatus === 'converted') {
      await publish<LeadConvertedEvent>(
        'crm.lead.converted',
        {
          leadId: id,
          convertedBy: updatedBy,
          conversionData: {
            course: lead.interestedCourse ?? '',
          },
        },
        'crm'
      );
    } else if (newStatus === 'lost') {
      await publish<LeadLostEvent>(
        'crm.lead.lost',
        {
          leadId: id,
          reason: reason ?? 'Not specified',
          markedBy: updatedBy,
        },
        'crm'
      );
    }

    return updatedLead;
  }

  /**
   * Update lead stage (progressive data collection)
   */
  async updateStage(id: string, stage: LeadStage, updatedBy?: string): Promise<Lead> {
    const lead = await leadRepository.findById(id);
    if (!lead) {
      throw new Error(`Lead with ID ${id} not found`);
    }

    const updatedLead = await leadRepository.updateStage(id, stage);
    if (!updatedLead) {
      throw new Error(`Failed to update stage for lead ${id}`);
    }

    await activityRepository.create({
      leadId: id,
      type: 'stage_changed',
      title: 'Stage Updated',
      description: `Lead progressed to ${stage}`,
      metadata: { previousStage: lead.stage, newStage: stage },
      createdBy: updatedBy,
    });

    return updatedLead;
  }

  /**
   * Assign lead to a user
   */
  async assignLead(id: string, assigneeId: string, assignedBy: string): Promise<Lead> {
    const lead = await leadRepository.findById(id);
    if (!lead) {
      throw new Error(`Lead with ID ${id} not found`);
    }

    const previousAssignee = lead.assignedTo;
    const updatedLead = await leadRepository.assignTo(id, assigneeId);
    if (!updatedLead) {
      throw new Error(`Failed to assign lead ${id}`);
    }

    await activityRepository.create({
      leadId: id,
      type: 'lead_assigned',
      title: 'Lead Assigned',
      description: 'Lead was assigned to a team member',
      metadata: { previousAssignee, newAssignee: assigneeId },
      createdBy: assignedBy,
    });

    await publish<LeadAssignedEvent>(
      'crm.lead.assigned',
      {
        leadId: id,
        previousAssignee: previousAssignee ?? undefined,
        newAssignee: assigneeId,
        assignedBy,
      },
      'crm'
    );

    return updatedLead;
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<boolean> {
    const lead = await leadRepository.findById(id);
    if (!lead) {
      throw new Error(`Lead with ID ${id} not found`);
    }

    return leadRepository.delete(id);
  }

  /**
   * Get leads requiring follow-up
   */
  async getLeadsRequiringFollowUp() {
    return leadRepository.findRequiringFollowUp();
  }

  /**
   * Validate status transition
   */
  private async validateStatusTransition(
    currentStatus: LeadStatus,
    newStatus: LeadStatus
  ): Promise<void> {
    const statusConfig = getConfig<{ transitions: StatusTransitions }>('crm.lead_statuses');
    const transitions = statusConfig?.transitions ?? {};
    
    const allowedTransitions = transitions[currentStatus] ?? [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
        `Allowed transitions: ${allowedTransitions.join(', ')}`
      );
    }
  }

  /**
   * Calculate lead score based on profile completeness and engagement
   */
  calculateLeadScore(lead: Lead): number {
    let score = 0;

    // Stage 1 completeness (20 points)
    if (lead.fullName) score += 5;
    if (lead.mobileNumber) score += 5;
    if (lead.email) score += 5;
    if (lead.interestedCourse) score += 5;

    // Stage 2 completeness (25 points)
    if (lead.qualification) score += 5;
    if (lead.pcmBackground !== null) score += 5;
    if (lead.passingYear) score += 5;
    if (lead.preferredBatch) score += 5;
    if (lead.budgetRange) score += 5;

    // Stage 3 completeness (25 points)
    if (lead.careerGoal) score += 5;
    if (lead.passportStatus) score += 5;
    if (lead.previousImuAttempt !== null) score += 5;
    if (lead.medicalAwareness !== null) score += 5;
    if (lead.decisionMaker) score += 5;

    // Stage 4 completeness (30 points)
    if (lead.documentsAvailable && lead.documentsAvailable.length > 0) score += 10;
    if (lead.feeDiscussionDone) score += 10;
    if (lead.parentCounsellingDone) score += 10;

    return score;
  }

  /**
   * Get lead statistics
   */
  async getStatistics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [byStatus, bySource, newToday, newWeek, newMonth, conversionRate] = await Promise.all([
      leadRepository.countByStatus(),
      leadRepository.countBySource(),
      leadRepository.countNewLeads(today),
      leadRepository.countNewLeads(weekAgo),
      leadRepository.countNewLeads(monthAgo),
      leadRepository.getConversionRate(monthAgo),
    ]);

    const totalLeads = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

    return {
      totalLeads,
      newLeadsToday: newToday,
      newLeadsThisWeek: newWeek,
      newLeadsThisMonth: newMonth,
      conversionRate,
      byStatus,
      bySource,
    };
  }
}

// Export singleton instance
export const leadService = new LeadService();
