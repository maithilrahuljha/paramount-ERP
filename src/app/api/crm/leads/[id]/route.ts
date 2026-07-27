/**
 * PMN ERP Platform - Single Lead API
 * 
 * RESTful API endpoints for single lead operations.
 * GET /api/crm/leads/[id] - Get a lead by ID
 * PATCH /api/crm/leads/[id] - Update a lead
 * DELETE /api/crm/leads/[id] - Delete a lead
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
import { updateLeadSchema, uuidSchema } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/crm/leads/[id]
 * Get a lead by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Validate ID
    const idResult = uuidSchema.safeParse(id);
    if (!idResult.success) {
      return errorResponse('INVALID_ID', 'Invalid lead ID format', undefined, 400);
    }
    
    const lead = await leadService.getLeadById(id);
    return successResponse(lead);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      const { id } = await params;
      return notFoundResponse('Lead', id);
    }
    return internalErrorResponse(error);
  }
}

/**
 * PATCH /api/crm/leads/[id]
 * Update a lead
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
    const result = updateLeadSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    // Convert null values to undefined for the service
    const updateData = {
      ...result.data,
      email: result.data.email ?? undefined,
      assignedTo: result.data.assignedTo ?? undefined,
    };
    const lead = await leadService.updateLead(id, updateData);
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

/**
 * DELETE /api/crm/leads/[id]
 * Delete a lead
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Validate ID
    const idResult = uuidSchema.safeParse(id);
    if (!idResult.success) {
      return errorResponse('INVALID_ID', 'Invalid lead ID format', undefined, 400);
    }
    
    await leadService.deleteLead(id);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      const { id } = await params;
      return notFoundResponse('Lead', id);
    }
    return internalErrorResponse(error);
  }
}
