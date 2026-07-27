/**
 * PMN ERP Platform - Communication Service
 * 
 * Business logic layer for Communication logging.
 */

import { communicationRepository, activityRepository } from '../repositories/activity-repository';
import { leadRepository } from '../repositories/lead-repository';
import { publish } from '@/kernel/events/event-bus';
import type { LeadCommunication } from '@/db/schema';
import type { LogCommunicationInput } from '../types';

/**
 * Communication Service - Handles all communication-related business logic
 */
export class CommunicationService {
  /**
   * Log a communication
   */
  async logCommunication(
    input: LogCommunicationInput,
    createdBy?: string
  ): Promise<LeadCommunication> {
    // Validate lead exists
    const lead = await leadRepository.findById(input.leadId);
    if (!lead) {
      throw new Error(`Lead with ID ${input.leadId} not found`);
    }

    const communication = await communicationRepository.create({
      leadId: input.leadId,
      type: input.type,
      direction: input.direction,
      subject: input.subject,
      content: input.content,
      duration: input.duration,
      outcome: input.outcome,
      createdBy,
    });

    // Update lead's last contacted time
    await leadRepository.update(input.leadId, {
      lastContactedAt: new Date(),
    });

    // If this is the first contact, update status
    if (lead.status === 'new' || lead.status === 'assigned') {
      await leadRepository.updateStatus(input.leadId, 'contacted');
    }

    // Log activity
    await activityRepository.create({
      leadId: input.leadId,
      type: 'communication_logged',
      title: `${input.direction === 'outbound' ? 'Outgoing' : 'Incoming'} ${input.type}`,
      description: input.subject ?? input.content?.substring(0, 100) ?? `${input.type} logged`,
      metadata: {
        communicationId: communication.id,
        type: input.type,
        direction: input.direction,
        duration: input.duration,
        outcome: input.outcome,
      },
      createdBy,
    });

    // Publish event
    await publish(
      'crm.communication.logged',
      {
        communicationId: communication.id,
        leadId: input.leadId,
        type: input.type,
        direction: input.direction,
        outcome: input.outcome,
      },
      'crm'
    );

    return communication;
  }

  /**
   * Get communications for a lead
   */
  async getCommunicationsByLead(leadId: string, limit: number = 50) {
    return communicationRepository.findByLead(leadId, limit);
  }

  /**
   * Get communication stats for a lead
   */
  async getCommunicationStats(leadId: string) {
    return communicationRepository.countByType(leadId);
  }
}

// Export singleton instance
export const communicationService = new CommunicationService();
