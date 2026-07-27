/**
 * PMN ERP Platform - Lead Assignment API
 * 
 * POST /api/crm/leads/[id]/assign - Assign lead to a user
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
import { assignLeadSchema, uuidSchema } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/crm/leads/[id]/assign
 * Assign lead to a user
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Validate ID
    const idResult = uuidSchema.safeParse(id);
    if (!idResult.success) {
      return errorResponse('INVALID_ID', 'Invalid lead ID format', undefined, 400);
    }
    
    const body = await request.json();
    
    // Validate input
    const result = assignLeadSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    // TODO: Get actual user ID from session
    const assignedBy = 'system';
    
    const lead = await leadService.assignLead(id, result.data.assigneeId, assignedBy);
    
    return successResponse(lead);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      const { id } = await params;
      return notFoundResponse('Lead', id);
    }
    return internalErrorResponse(error);
  }
}
