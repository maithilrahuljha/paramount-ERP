/**
 * PMN ERP Platform - Activity Repository
 * 
 * Data access layer for Lead Activities, Communications, Notes, and Follow-ups.
 */

import { db } from '@/db';
import { leadActivities, leadCommunications, leadNotes, followUps, users } from '@/db/schema';
import type { LeadActivity, LeadCommunication, LeadNote, FollowUp } from '@/db/schema';
import { eq, and, gte, lte, desc, asc, count } from 'drizzle-orm';

// ============================================================================
// Activity Repository
// ============================================================================

export class ActivityRepository {
  /**
   * Create an activity
   */
  async create(data: {
    leadId: string;
    type: LeadActivity['type'];
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
    createdBy?: string;
  }): Promise<LeadActivity> {
    const result = await db
      .insert(leadActivities)
      .values({
        leadId: data.leadId,
        type: data.type,
        title: data.title,
        description: data.description,
        metadata: data.metadata ?? {},
        createdBy: data.createdBy,
        createdAt: new Date(),
      })
      .returning();
    
    return result[0];
  }

  /**
   * Get activities for a lead
   */
  async findByLead(leadId: string, limit: number = 50): Promise<Array<LeadActivity & { createdByUser: { id: string; name: string } | null }>> {
    const result = await db
      .select({
        activity: leadActivities,
        createdByUser: {
          id: users.id,
          name: users.name,
        },
      })
      .from(leadActivities)
      .leftJoin(users, eq(leadActivities.createdBy, users.id))
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt))
      .limit(limit);
    
    return result.map((r) => ({
      ...r.activity,
      createdByUser: r.createdByUser,
    }));
  }

  /**
   * Get recent activities across all leads
   */
  async findRecent(limit: number = 20): Promise<Array<LeadActivity & { createdByUser: { id: string; name: string } | null }>> {
    const result = await db
      .select({
        activity: leadActivities,
        createdByUser: {
          id: users.id,
          name: users.name,
        },
      })
      .from(leadActivities)
      .leftJoin(users, eq(leadActivities.createdBy, users.id))
      .orderBy(desc(leadActivities.createdAt))
      .limit(limit);
    
    return result.map((r) => ({
      ...r.activity,
      createdByUser: r.createdByUser,
    }));
  }
}

// ============================================================================
// Communication Repository
// ============================================================================

export class CommunicationRepository {
  /**
   * Log a communication
   */
  async create(data: {
    leadId: string;
    type: LeadCommunication['type'];
    direction: LeadCommunication['direction'];
    subject?: string;
    content?: string;
    duration?: number;
    outcome?: string;
    metadata?: Record<string, unknown>;
    createdBy?: string;
  }): Promise<LeadCommunication> {
    const result = await db
      .insert(leadCommunications)
      .values({
        leadId: data.leadId,
        type: data.type,
        direction: data.direction,
        subject: data.subject,
        content: data.content,
        duration: data.duration,
        outcome: data.outcome,
        metadata: data.metadata ?? {},
        createdBy: data.createdBy,
        createdAt: new Date(),
      })
      .returning();
    
    return result[0];
  }

  /**
   * Get communications for a lead
   */
  async findByLead(leadId: string, limit: number = 50): Promise<Array<LeadCommunication & { createdByUser: { id: string; name: string } | null }>> {
    const result = await db
      .select({
        communication: leadCommunications,
        createdByUser: {
          id: users.id,
          name: users.name,
        },
      })
      .from(leadCommunications)
      .leftJoin(users, eq(leadCommunications.createdBy, users.id))
      .where(eq(leadCommunications.leadId, leadId))
      .orderBy(desc(leadCommunications.createdAt))
      .limit(limit);
    
    return result.map((r) => ({
      ...r.communication,
      createdByUser: r.createdByUser,
    }));
  }

  /**
   * Count communications by type for a lead
   */
  async countByType(leadId: string): Promise<Record<string, number>> {
    const result = await db
      .select({
        type: leadCommunications.type,
        count: count(),
      })
      .from(leadCommunications)
      .where(eq(leadCommunications.leadId, leadId))
      .groupBy(leadCommunications.type);
    
    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.type] = row.count;
    }
    return counts;
  }
}

// ============================================================================
// Notes Repository
// ============================================================================

export class NotesRepository {
  /**
   * Create a note
   */
  async create(data: {
    leadId: string;
    content: string;
    isPinned?: boolean;
    createdBy?: string;
  }): Promise<LeadNote> {
    const result = await db
      .insert(leadNotes)
      .values({
        leadId: data.leadId,
        content: data.content,
        isPinned: data.isPinned ?? false,
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }

  /**
   * Update a note
   */
  async update(id: string, data: { content?: string; isPinned?: boolean }): Promise<LeadNote | null> {
    const result = await db
      .update(leadNotes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(leadNotes.id, id))
      .returning();
    
    return result[0] ?? null;
  }

  /**
   * Delete a note
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(leadNotes)
      .where(eq(leadNotes.id, id))
      .returning({ id: leadNotes.id });
    
    return result.length > 0;
  }

  /**
   * Get notes for a lead
   */
  async findByLead(leadId: string): Promise<Array<LeadNote & { createdByUser: { id: string; name: string } | null }>> {
    const result = await db
      .select({
        note: leadNotes,
        createdByUser: {
          id: users.id,
          name: users.name,
        },
      })
      .from(leadNotes)
      .leftJoin(users, eq(leadNotes.createdBy, users.id))
      .where(eq(leadNotes.leadId, leadId))
      .orderBy(desc(leadNotes.isPinned), desc(leadNotes.createdAt));
    
    return result.map((r) => ({
      ...r.note,
      createdByUser: r.createdByUser,
    }));
  }
}

// ============================================================================
// Follow-up Repository
// ============================================================================

export class FollowUpRepository {
  /**
   * Create a follow-up
   */
  async create(data: {
    leadId: string;
    scheduledAt: Date;
    type: string;
    purpose?: string;
    notes?: string;
    assignedTo?: string;
    createdBy?: string;
  }): Promise<FollowUp> {
    const result = await db
      .insert(followUps)
      .values({
        leadId: data.leadId,
        scheduledAt: data.scheduledAt,
        type: data.type,
        purpose: data.purpose,
        notes: data.notes,
        assignedTo: data.assignedTo,
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }

  /**
   * Update a follow-up
   */
  async update(id: string, data: Partial<{
    scheduledAt: Date;
    type: string;
    purpose: string;
    notes: string;
    outcome: string;
    isCompleted: boolean;
    completedAt: Date;
    assignedTo: string;
  }>): Promise<FollowUp | null> {
    const result = await db
      .update(followUps)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(followUps.id, id))
      .returning();
    
    return result[0] ?? null;
  }

  /**
   * Complete a follow-up
   */
  async complete(id: string, outcome: string): Promise<FollowUp | null> {
    return this.update(id, {
      isCompleted: true,
      completedAt: new Date(),
      outcome,
    });
  }

  /**
   * Delete a follow-up
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(followUps)
      .where(eq(followUps.id, id))
      .returning({ id: followUps.id });
    
    return result.length > 0;
  }

  /**
   * Get follow-ups for a lead
   */
  async findByLead(leadId: string): Promise<Array<FollowUp & { assignedUser: { id: string; name: string } | null }>> {
    const result = await db
      .select({
        followUp: followUps,
        assignedUser: {
          id: users.id,
          name: users.name,
        },
      })
      .from(followUps)
      .leftJoin(users, eq(followUps.assignedTo, users.id))
      .where(eq(followUps.leadId, leadId))
      .orderBy(desc(followUps.scheduledAt));
    
    return result.map((r) => ({
      ...r.followUp,
      assignedUser: r.assignedUser,
    }));
  }

  /**
   * Get pending follow-ups for a user
   */
  async findPendingByUser(userId: string): Promise<FollowUp[]> {
    return db
      .select()
      .from(followUps)
      .where(
        and(
          eq(followUps.assignedTo, userId),
          eq(followUps.isCompleted, false)
        )
      )
      .orderBy(asc(followUps.scheduledAt));
  }

  /**
   * Get overdue follow-ups
   */
  async findOverdue(): Promise<FollowUp[]> {
    return db
      .select()
      .from(followUps)
      .where(
        and(
          lte(followUps.scheduledAt, new Date()),
          eq(followUps.isCompleted, false)
        )
      )
      .orderBy(asc(followUps.scheduledAt));
  }

  /**
   * Get today's follow-ups
   */
  async findToday(): Promise<FollowUp[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return db
      .select()
      .from(followUps)
      .where(
        and(
          gte(followUps.scheduledAt, today),
          lte(followUps.scheduledAt, tomorrow),
          eq(followUps.isCompleted, false)
        )
      )
      .orderBy(asc(followUps.scheduledAt));
  }
}

// Export singleton instances
export const activityRepository = new ActivityRepository();
export const communicationRepository = new CommunicationRepository();
export const notesRepository = new NotesRepository();
export const followUpRepository = new FollowUpRepository();
