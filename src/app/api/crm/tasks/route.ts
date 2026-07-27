/**
 * PMN ERP Platform - Tasks API
 * 
 * RESTful API endpoints for task management.
 * GET /api/crm/tasks - List tasks
 * POST /api/crm/tasks - Create a new task
 */

import { NextRequest } from 'next/server';
import { taskService } from '@/modules/crm/services/task-service';
import {
  successResponse,
  paginatedResponse,
  internalErrorResponse,
  validationErrorResponse,
  parsePaginationParams,
} from '@/lib/api-response';
import { createTaskSchema, taskFiltersSchema } from '@/lib/validation';
import type { TaskFilters } from '@/modules/crm/types';

/**
 * GET /api/crm/tasks
 * List tasks with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const pagination = parsePaginationParams(searchParams);
    
    // Parse filters
    const filterParams: Record<string, unknown> = {};
    
    const status = searchParams.get('status');
    if (status) {
      filterParams.status = status.includes(',') ? status.split(',') : status;
    }
    
    const priority = searchParams.get('priority');
    if (priority) filterParams.priority = priority;
    
    const assignedTo = searchParams.get('assignedTo');
    if (assignedTo) filterParams.assignedTo = assignedTo;
    
    const leadId = searchParams.get('leadId');
    if (leadId) filterParams.leadId = leadId;
    
    const dueBefore = searchParams.get('dueBefore');
    if (dueBefore) filterParams.dueBefore = new Date(dueBefore);
    
    const dueAfter = searchParams.get('dueAfter');
    if (dueAfter) filterParams.dueAfter = new Date(dueAfter);
    
    // Validate filters
    const filterResult = taskFiltersSchema.safeParse(filterParams);
    if (!filterResult.success) {
      return validationErrorResponse(
        filterResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    const filters = filterResult.data as TaskFilters;
    
    // Get tasks
    const result = await taskService.getTasks(filters, pagination);
    
    return paginatedResponse(result.data, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

/**
 * POST /api/crm/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    // Create task
    const task = await taskService.createTask(result.data);
    
    return successResponse(task, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
