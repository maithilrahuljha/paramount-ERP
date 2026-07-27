/**
 * PMN ERP Platform - Single Task API
 * 
 * GET /api/crm/tasks/[id] - Get a task by ID
 * PATCH /api/crm/tasks/[id] - Update a task
 * DELETE /api/crm/tasks/[id] - Delete a task
 */

import { NextRequest } from 'next/server';
import { taskService } from '@/modules/crm/services/task-service';
import {
  successResponse,
  errorResponse,
  internalErrorResponse,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { updateTaskSchema, uuidSchema } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/crm/tasks/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const idResult = uuidSchema.safeParse(id);
    if (!idResult.success) {
      return errorResponse('INVALID_ID', 'Invalid task ID format', undefined, 400);
    }
    
    const task = await taskService.getTaskById(id);
    return successResponse(task);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      const { id } = await params;
      return notFoundResponse('Task', id);
    }
    return internalErrorResponse(error);
  }
}

/**
 * PATCH /api/crm/tasks/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const idResult = uuidSchema.safeParse(id);
    if (!idResult.success) {
      return errorResponse('INVALID_ID', 'Invalid task ID format', undefined, 400);
    }
    
    const body = await request.json();
    
    const result = updateTaskSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    // Convert null to undefined
    const updateData = {
      ...result.data,
      assignedTo: result.data.assignedTo ?? undefined,
      reminderAt: result.data.reminderAt ?? undefined,
    };
    
    const task = await taskService.updateTask(id, updateData);
    return successResponse(task);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      const { id } = await params;
      return notFoundResponse('Task', id);
    }
    return internalErrorResponse(error);
  }
}

/**
 * DELETE /api/crm/tasks/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const idResult = uuidSchema.safeParse(id);
    if (!idResult.success) {
      return errorResponse('INVALID_ID', 'Invalid task ID format', undefined, 400);
    }
    
    await taskService.deleteTask(id);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      const { id } = await params;
      return notFoundResponse('Task', id);
    }
    return internalErrorResponse(error);
  }
}
