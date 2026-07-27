/**
 * PMN ERP Platform - Communications API
 * 
 * POST /api/crm/communications - Log a communication
 */

import { NextRequest } from 'next/server';
import { communicationService } from '@/modules/crm/services/communication-service';
import {
  successResponse,
  internalErrorResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { logCommunicationSchema } from '@/lib/validation';

/**
 * POST /api/crm/communications
 * Log a communication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = logCommunicationSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    const communication = await communicationService.logCommunication(result.data);
    
    return successResponse(communication, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
