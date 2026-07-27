/**
 * PMN ERP Platform - Task Service
 * 
 * Business logic layer for Task management.
 */

import { taskRepository } from '../repositories/task-repository';
import type { PaginationOptions } from '../repositories/lead-repository';
import { activityRepository } from '../repositories/activity-repository';
import { publish } from '@/kernel/events/event-bus';
import type { Task } from '@/db/schema';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskStatus,
} from '../types';

/**
 * Task Service - Handles all task-related business logic
 */
export class TaskService {
  /**
   * Create a new task
   */
  async createTask(input: CreateTaskInput, createdBy?: string): Promise<Task> {
    const task = await taskRepository.create({
      title: input.title,
      description: input.description,
      type: input.type,
      priority: input.priority ?? 'normal',
      dueDate: input.dueDate,
      leadId: input.leadId,
      assignedTo: input.assignedTo,
      reminderAt: input.reminderAt,
      status: 'pending',
      createdBy,
    });

    // If task is related to a lead, log activity
    if (input.leadId) {
      await activityRepository.create({
        leadId: input.leadId,
        type: 'task_created',
        title: 'Task Created',
        description: input.title,
        metadata: { taskId: task.id, taskType: input.type },
        createdBy,
      });
    }

    // Publish event
    await publish(
      'crm.task.created',
      {
        taskId: task.id,
        leadId: input.leadId,
        assignedTo: input.assignedTo,
        dueDate: input.dueDate,
      },
      'crm'
    );

    return task;
  }

  /**
   * Get a task by ID
   */
  async getTaskById(id: string) {
    const task = await taskRepository.findByIdWithRelations(id);
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }
    return task;
  }

  /**
   * Get all tasks with filtering and pagination
   */
  async getTasks(
    filters: TaskFilters = {},
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ) {
    return taskRepository.findAll(filters, pagination);
  }

  /**
   * Update a task
   */
  async updateTask(id: string, input: UpdateTaskInput, updatedBy?: string): Promise<Task> {
    const existingTask = await taskRepository.findById(id);
    if (!existingTask) {
      throw new Error(`Task with ID ${id} not found`);
    }

    const task = await taskRepository.update(id, input);
    if (!task) {
      throw new Error(`Failed to update task ${id}`);
    }

    return task;
  }

  /**
   * Complete a task
   */
  async completeTask(id: string, completedBy?: string): Promise<Task> {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }

    if (task.status === 'completed') {
      throw new Error('Task is already completed');
    }

    const completedTask = await taskRepository.complete(id);
    if (!completedTask) {
      throw new Error(`Failed to complete task ${id}`);
    }

    // If task is related to a lead, log activity
    if (task.leadId) {
      await activityRepository.create({
        leadId: task.leadId,
        type: 'task_completed',
        title: 'Task Completed',
        description: task.title,
        metadata: { taskId: task.id, taskType: task.type },
        createdBy: completedBy,
      });
    }

    // Publish event
    await publish(
      'crm.task.completed',
      {
        taskId: id,
        leadId: task.leadId,
        completedBy,
      },
      'crm'
    );

    return completedTask;
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<boolean> {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }

    return taskRepository.delete(id);
  }

  /**
   * Get tasks for a lead
   */
  async getTasksByLead(leadId: string): Promise<Task[]> {
    return taskRepository.findByLead(leadId);
  }

  /**
   * Get tasks assigned to a user
   */
  async getTasksByAssignee(userId: string, status?: TaskStatus): Promise<Task[]> {
    return taskRepository.findByAssignee(userId, status);
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    return taskRepository.findOverdue();
  }

  /**
   * Get tasks due today
   */
  async getTasksDueToday(): Promise<Task[]> {
    return taskRepository.findDueToday();
  }

  /**
   * Get task statistics for a user
   */
  async getTaskStats(userId?: string) {
    const counts = await taskRepository.countByStatus(userId);
    const overdue = await taskRepository.findOverdue();
    const dueToday = await taskRepository.findDueToday();

    return {
      ...counts,
      overdue: overdue.length,
      dueToday: dueToday.length,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    };
  }
}

// Export singleton instance
export const taskService = new TaskService();
