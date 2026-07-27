/**
 * PMN ERP Platform - Lead Status API
 * 
 * PATCH /api/crm/leads/[id]/status - Update lead status
 */

import { NextRequest } from 'next/server';
import { leadService } from '@/modules/crm/services/lead-service';
import {
  successResponse,
  errorResponse,
  internalErrorResponse,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { updateLeadStatusSchema, uuidSchema } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/crm/leads/[id]/status
 * Update lead status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Validate ID
    const idResult = uuidSchema.safeParse(id);
    if (!idResult.success) {
      return errorResponse('INVALID_ID', 'Invalid lead ID format', undefined, 400);
    }
    
    const body = await request.json();
    
    // Validate input
    const result = updateLeadStatusSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    // TODO: Get actual user ID from session
    const updatedBy = 'system';
    
    const lead = await leadService.updateStatus(
      id,
      result.data.status,
      updatedBy,
      result.data.reason
    );
    
    return successResponse(lead);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      const { id } = await params;
      return notFoundResponse('Lead', id);
    }
    if (error instanceof Error && error.message.includes('Invalid status transition')) {
      return errorResponse('INVALID_TRANSITION', error.message, undefined, 400);
    }
    return internalErrorResponse(error);
  }
}
