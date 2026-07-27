/**
 * PMN ERP Platform - Task Repository
 * 
 * Data access layer for Task entities.
 */

import { db } from '@/db';
import { tasks, users, leads } from '@/db/schema';
import type { Task, NewTask } from '@/db/schema';
import type { TaskFilters, TaskStatus, TaskPriority } from '../types';
import { eq, and, gte, lte, inArray, desc, asc, count } from 'drizzle-orm';
import type { PaginationOptions, PaginatedResult } from './lead-repository';

export class TaskRepository {
  /**
   * Find task by ID
   */
  async findById(id: string): Promise<Task | null> {
    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    
    return result[0] ?? null;
  }

  /**
   * Find task by ID with relations
   */
  async findByIdWithRelations(id: string) {
    const result = await db
      .select({
        task: tasks,
        assignedUser: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        },
        lead: {
          id: leads.id,
          fullName: leads.fullName,
          mobileNumber: leads.mobileNumber,
        },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .leftJoin(leads, eq(tasks.leadId, leads.id))
      .where(eq(tasks.id, id))
      .limit(1);
    
    if (!result[0]) return null;
    
    return {
      ...result[0].task,
      assignedUser: result[0].assignedUser,
      lead: result[0].lead,
    };
  }

  /**
   * Find all tasks with pagination and filters
   */
  async findAll(
    filters: TaskFilters = {},
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<Task & { assignedUser: { id: string; name: string; email: string; avatar: string | null } | null }>> {
    const conditions = this.buildFilterConditions(filters);
    
    const countResult = await db
      .select({ count: count() })
      .from(tasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = countResult[0]?.count ?? 0;
    const offset = (pagination.page - 1) * pagination.pageSize;
    
    const result = await db
      .select({
        task: tasks,
        assignedUser: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tasks.createdAt))
      .limit(pagination.pageSize)
      .offset(offset);
    
    return {
      data: result.map((r) => ({
        ...r.task,
        assignedUser: r.assignedUser,
      })),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  /**
   * Create a new task
   */
  async create(data: NewTask): Promise<Task> {
    const result = await db
      .insert(tasks)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  }

  /**
   * Update a task
   */
  async update(id: string, data: Partial<NewTask>): Promise<Task | null> {
    const result = await db
      .update(tasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();
    
    return result[0] ?? null;
  }

  /**
   * Delete a task
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });
    
    return result.length > 0;
  }

  /**
   * Complete a task
   */
  async complete(id: string): Promise<Task | null> {
    return this.update(id, {
      status: 'completed',
      completedAt: new Date(),
    });
  }

  /**
   * Get tasks for a lead
   */
  async findByLead(leadId: string): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.leadId, leadId))
      .orderBy(desc(tasks.createdAt));
  }

  /**
   * Get tasks assigned to a user
   */
  async findByAssignee(userId: string, status?: TaskStatus): Promise<Task[]> {
    const conditions = [eq(tasks.assignedTo, userId)];
    if (status) {
      conditions.push(eq(tasks.status, status));
    }
    
    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.dueDate));
  }

  /**
   * Get overdue tasks
   */
  async findOverdue(): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(
        and(
          lte(tasks.dueDate, new Date()),
          inArray(tasks.status, ['pending', 'in_progress'])
        )
      )
      .orderBy(asc(tasks.dueDate));
  }

  /**
   * Get tasks due today
   */
  async findDueToday(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return db
      .select()
      .from(tasks)
      .where(
        and(
          gte(tasks.dueDate, today),
          lte(tasks.dueDate, tomorrow),
          inArray(tasks.status, ['pending', 'in_progress'])
        )
      )
      .orderBy(asc(tasks.dueDate));
  }

  /**
   * Count tasks by status
   */
  async countByStatus(userId?: string): Promise<Record<TaskStatus, number>> {
    const conditions = userId ? [eq(tasks.assignedTo, userId)] : [];
    
    const result = await db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(tasks.status);
    
    const counts: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };
    
    for (const row of result) {
      counts[row.status] = row.count;
    }
    
    return counts as Record<TaskStatus, number>;
  }

  /**
   * Build filter conditions
   */
  private buildFilterConditions(filters: TaskFilters) {
    const conditions = [];

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(tasks.status, filters.status));
      } else {
        conditions.push(eq(tasks.status, filters.status));
      }
    }

    if (filters.priority) {
      conditions.push(eq(tasks.priority, filters.priority));
    }

    if (filters.assignedTo) {
      conditions.push(eq(tasks.assignedTo, filters.assignedTo));
    }

    if (filters.leadId) {
      conditions.push(eq(tasks.leadId, filters.leadId));
    }

    if (filters.dueBefore) {
      conditions.push(lte(tasks.dueDate, filters.dueBefore));
    }

    if (filters.dueAfter) {
      conditions.push(gte(tasks.dueDate, filters.dueAfter));
    }

    return conditions;
  }
}

export const taskRepository = new TaskRepository();
