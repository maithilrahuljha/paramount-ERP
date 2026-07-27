/**
 * PMN ERP Platform - Follow-up Service
 * 
 * Business logic layer for Follow-up management.
 */

import { followUpRepository, activityRepository } from '../repositories/activity-repository';
import { leadRepository } from '../repositories/lead-repository';
import { publish } from '@/kernel/events/event-bus';
import type { FollowUp } from '@/db/schema';
import type { CreateFollowUpInput, UpdateFollowUpInput } from '../types';

/**
 * Follow-up Service - Handles all follow-up related business logic
 */
export class FollowUpService {
  /**
   * Create a follow-up
   */
  async createFollowUp(input: CreateFollowUpInput, createdBy?: string): Promise<FollowUp> {
    // Validate lead exists
    const lead = await leadRepository.findById(input.leadId);
    if (!lead) {
      throw new Error(`Lead with ID ${input.leadId} not found`);
    }

    const followUp = await followUpRepository.create({
      leadId: input.leadId,
      scheduledAt: input.scheduledAt,
      type: input.type,
      purpose: input.purpose,
      notes: input.notes,
      assignedTo: input.assignedTo,
      createdBy,
    });

    // Update lead's next follow-up date
    await leadRepository.update(input.leadId, {
      nextFollowUpAt: input.scheduledAt,
      followUpCount: (lead.followUpCount ?? 0) + 1,
    });

    // Log activity
    await activityRepository.create({
      leadId: input.leadId,
      type: 'follow_up_scheduled',
      title: 'Follow-up Scheduled',
      description: `${input.type} follow-up scheduled for ${input.scheduledAt.toLocaleDateString()}`,
      metadata: { followUpId: followUp.id, type: input.type, scheduledAt: input.scheduledAt },
      createdBy,
    });

    // Publish event
    await publish(
      'crm.follow_up.scheduled',
      {
        followUpId: followUp.id,
        leadId: input.leadId,
        scheduledAt: input.scheduledAt,
        type: input.type,
        assignedTo: input.assignedTo,
      },
      'crm'
    );

    return followUp;
  }

  /**
   * Update a follow-up
   */
  async updateFollowUp(id: string, input: UpdateFollowUpInput): Promise<FollowUp> {
    const followUp = await followUpRepository.update(id, input);
    if (!followUp) {
      throw new Error(`Follow-up with ID ${id} not found`);
    }
    return followUp;
  }

  /**
   * Complete a follow-up
   */
  async completeFollowUp(id: string, outcome: string, completedBy?: string): Promise<FollowUp> {
    const existingFollowUp = await this.getFollowUpById(id);
    
    const followUp = await followUpRepository.complete(id, outcome);
    if (!followUp) {
      throw new Error(`Failed to complete follow-up ${id}`);
    }

    // Update lead's last contacted time
    await leadRepository.update(followUp.leadId, {
      lastContactedAt: new Date(),
    });

    // Log activity
    await activityRepository.create({
      leadId: followUp.leadId,
      type: 'follow_up_scheduled', // Using existing type
      title: 'Follow-up Completed',
      description: `${followUp.type} follow-up completed: ${outcome}`,
      metadata: { followUpId: id, type: followUp.type, outcome },
      createdBy: completedBy,
    });

    // Publish event
    await publish(
      'crm.follow_up.completed',
      {
        followUpId: id,
        leadId: followUp.leadId,
        outcome,
        completedBy,
      },
      'crm'
    );

    return followUp;
  }

  /**
   * Delete a follow-up
   */
  async deleteFollowUp(id: string): Promise<boolean> {
    return followUpRepository.delete(id);
  }

  /**
   * Get a follow-up by ID
   */
  private async getFollowUpById(id: string): Promise<FollowUp> {
    const followUps = await followUpRepository.findByLead(id);
    const followUp = followUps.find((f) => f.id === id);
    if (!followUp) {
      throw new Error(`Follow-up with ID ${id} not found`);
    }
    return followUp;
  }

  /**
   * Get follow-ups for a lead
   */
  async getFollowUpsByLead(leadId: string) {
    return followUpRepository.findByLead(leadId);
  }

  /**
   * Get pending follow-ups for a user
   */
  async getPendingFollowUps(userId: string): Promise<FollowUp[]> {
    return followUpRepository.findPendingByUser(userId);
  }

  /**
   * Get overdue follow-ups
   */
  async getOverdueFollowUps(): Promise<FollowUp[]> {
    return followUpRepository.findOverdue();
  }

  /**
   * Get today's follow-ups
   */
  async getTodaysFollowUps(): Promise<FollowUp[]> {
    return followUpRepository.findToday();
  }

  /**
   * Get follow-up statistics
   */
  async getFollowUpStats() {
    const overdue = await followUpRepository.findOverdue();
    const today = await followUpRepository.findToday();

    return {
      overdue: overdue.length,
      dueToday: today.length,
    };
  }
}

// Export singleton instance
export const followUpService = new FollowUpService();
