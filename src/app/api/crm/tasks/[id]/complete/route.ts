/**
 * PMN ERP Platform - Task Completion API
 * 
 * POST /api/crm/tasks/[id]/complete - Mark task as completed
 */

import { NextRequest } from 'next/server';
import { taskService } from '@/modules/crm/services/task-service';
import {
  successResponse,
  errorResponse,
  internalErrorResponse,
  notFoundResponse,
} from '@/lib/api-response';
import { uuidSchema } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/crm/tasks/[id]/complete
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const idResult = uuidSchema.safeParse(id);
    if (!idResult.success) {
      return errorResponse('INVALID_ID', 'Invalid task ID format', undefined, 400);
    }
    
    const task = await taskService.completeTask(id);
    return successResponse(task);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      const { id } = await params;
      return notFoundResponse('Task', id);
    }
    if (error instanceof Error && error.message.includes('already completed')) {
      return errorResponse('ALREADY_COMPLETED', error.message, undefined, 400);
    }
    return internalErrorResponse(error);
  }
}
