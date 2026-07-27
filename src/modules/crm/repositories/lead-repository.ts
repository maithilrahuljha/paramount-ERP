/**
 * PMN ERP Platform - Lead Repository
 * 
 * Data access layer for Lead entities.
 * Implements Repository Pattern with clean separation from business logic.
 */

import { db } from '@/db';
import { leads, users, leadActivities } from '@/db/schema';
import type { Lead, NewLead } from '@/db/schema';
import type { LeadFilters, LeadSortOptions, LeadStatus, LeadStage } from '../types';
import { eq, and, or, gte, lte, like, inArray, desc, asc, sql, count } from 'drizzle-orm';

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Lead Repository - Handles all lead data operations
 */
export class LeadRepository {
  /**
   * Find lead by ID
   */
  async findById(id: string): Promise<Lead | null> {
    const result = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1);
    
    return result[0] ?? null;
  }

  /**
   * Find lead by ID with relations
   */
  async findByIdWithRelations(id: string): Promise<Lead & { assignedUser: { id: string; name: string; email: string; avatar: string | null } | null } | null> {
    const result = await db
      .select({
        lead: leads,
        assignedUser: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        },
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(eq(leads.id, id))
      .limit(1);
    
    if (!result[0]) return null;
    
    return {
      ...result[0].lead,
      assignedUser: result[0].assignedUser,
    };
  }

  /**
   * Find lead by mobile number
   */
  async findByMobile(mobileNumber: string): Promise<Lead | null> {
    const result = await db
      .select()
      .from(leads)
      .where(eq(leads.mobileNumber, mobileNumber))
      .limit(1);
    
    return result[0] ?? null;
  }

  /**
   * Find all leads with pagination and filters
   */
  async findAll(
    filters: LeadFilters = {},
    sort: LeadSortOptions = { field: 'createdAt', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<Lead & { assignedUser: { id: string; name: string; email: string; avatar: string | null } | null }>> {
    const conditions = this.buildFilterConditions(filters);
    
    // Get total count
    const countResult = await db
      .select({ count: count() })
      .from(leads)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = countResult[0]?.count ?? 0;
    
    // Get paginated data
    const offset = (pagination.page - 1) * pagination.pageSize;
    const orderBy = this.buildSortOrder(sort);
    
    const result = await db
      .select({
        lead: leads,
        assignedUser: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        },
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderBy)
      .limit(pagination.pageSize)
      .offset(offset);
    
    return {
      data: result.map((r) => ({
        ...r.lead,
        assignedUser: r.assignedUser,
      })),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  /**
   * Create a new lead
   */
  async create(data: NewLead): Promise<Lead> {
    const result = await db
      .insert(leads)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }

  /**
   * Update a lead
   */
  async update(id: string, data: Partial<NewLead>): Promise<Lead | null> {
    const result = await db
      .update(leads)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id))
      .returning();
    
    return result[0] ?? null;
  }

  /**
   * Delete a lead
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(leads)
      .where(eq(leads.id, id))
      .returning({ id: leads.id });
    
    return result.length > 0;
  }

  /**
   * Update lead status
   */
  async updateStatus(id: string, status: LeadStatus, lostReason?: string): Promise<Lead | null> {
    const updateData: Partial<NewLead> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'converted') {
      updateData.convertedAt = new Date();
    }

    if (status === 'lost' && lostReason) {
      updateData.lostReason = lostReason;
    }

    return this.update(id, updateData);
  }

  /**
   * Update lead stage
   */
  async updateStage(id: string, stage: LeadStage): Promise<Lead | null> {
    return this.update(id, { stage });
  }

  /**
   * Assign lead to user
   */
  async assignTo(id: string, userId: string): Promise<Lead | null> {
    return this.update(id, { assignedTo: userId, status: 'assigned' });
  }

  /**
   * Get leads by assigned user
   */
  async findByAssignee(userId: string, pagination: PaginationOptions): Promise<PaginatedResult<Lead>> {
    return this.findAll({ assignedTo: userId }, { field: 'createdAt', direction: 'desc' }, pagination) as Promise<PaginatedResult<Lead>>;
  }

  /**
   * Get leads requiring follow-up
   */
  async findRequiringFollowUp(beforeDate: Date = new Date()): Promise<Lead[]> {
    const result = await db
      .select()
      .from(leads)
      .where(
        and(
          lte(leads.nextFollowUpAt, beforeDate),
          inArray(leads.status, ['contacted', 'qualified', 'counselling', 'follow_up', 'admission_ready'])
        )
      )
      .orderBy(asc(leads.nextFollowUpAt));
    
    return result;
  }

  /**
   * Get lead counts by status
   */
  async countByStatus(): Promise<Record<LeadStatus, number>> {
    const result = await db
      .select({
        status: leads.status,
        count: count(),
      })
      .from(leads)
      .groupBy(leads.status);
    
    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.status] = row.count;
    }
    
    return counts as Record<LeadStatus, number>;
  }

  /**
   * Get lead counts by source
   */
  async countBySource(): Promise<Record<string, number>> {
    const result = await db
      .select({
        source: leads.leadSource,
        count: count(),
      })
      .from(leads)
      .groupBy(leads.leadSource);
    
    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.source] = row.count;
    }
    
    return counts;
  }

  /**
   * Get new leads count for period
   */
  async countNewLeads(since: Date): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(leads)
      .where(gte(leads.createdAt, since));
    
    return result[0]?.count ?? 0;
  }

  /**
   * Get conversion rate
   */
  async getConversionRate(since?: Date): Promise<number> {
    const conditions = since ? [gte(leads.createdAt, since)] : [];
    
    const totalResult = await db
      .select({ count: count() })
      .from(leads)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const convertedConditions = [...conditions, eq(leads.status, 'converted')];
    const convertedResult = await db
      .select({ count: count() })
      .from(leads)
      .where(and(...convertedConditions));
    
    const total = totalResult[0]?.count ?? 0;
    const converted = convertedResult[0]?.count ?? 0;
    
    return total > 0 ? (converted / total) * 100 : 0;
  }

  /**
   * Build filter conditions for queries
   */
  private buildFilterConditions(filters: LeadFilters) {
    const conditions = [];

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(leads.status, filters.status));
      } else {
        conditions.push(eq(leads.status, filters.status));
      }
    }

    if (filters.stage) {
      if (Array.isArray(filters.stage)) {
        conditions.push(inArray(leads.stage, filters.stage));
      } else {
        conditions.push(eq(leads.stage, filters.stage));
      }
    }

    if (filters.leadSource) {
      if (Array.isArray(filters.leadSource)) {
        conditions.push(inArray(leads.leadSource, filters.leadSource));
      } else {
        conditions.push(eq(leads.leadSource, filters.leadSource));
      }
    }

    if (filters.assignedTo) {
      conditions.push(eq(leads.assignedTo, filters.assignedTo));
    }

    if (filters.interestedCourse) {
      conditions.push(eq(leads.interestedCourse, filters.interestedCourse));
    }

    if (filters.city) {
      conditions.push(eq(leads.city, filters.city));
    }

    if (filters.priority) {
      conditions.push(eq(leads.priority, filters.priority));
    }

    if (filters.createdAfter) {
      conditions.push(gte(leads.createdAt, filters.createdAfter));
    }

    if (filters.createdBefore) {
      conditions.push(lte(leads.createdAt, filters.createdBefore));
    }

    if (filters.nextFollowUpBefore) {
      conditions.push(lte(leads.nextFollowUpAt, filters.nextFollowUpBefore));
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(leads.fullName, searchTerm),
          like(leads.mobileNumber, searchTerm),
          like(leads.email ?? '', searchTerm),
          like(leads.city ?? '', searchTerm)
        )
      );
    }

    return conditions;
  }

  /**
   * Build sort order for queries
   */
  private buildSortOrder(sort: LeadSortOptions) {
    const column = (() => {
      switch (sort.field) {
        case 'fullName': return leads.fullName;
        case 'status': return leads.status;
        case 'nextFollowUpAt': return leads.nextFollowUpAt;
        case 'score': return leads.score;
        case 'updatedAt': return leads.updatedAt;
        default: return leads.createdAt;
      }
    })();

    return sort.direction === 'asc' ? asc(column) : desc(column);
  }
}

// Export singleton instance
export const leadRepository = new LeadRepository();
