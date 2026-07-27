/**
 * PMN ERP Platform - Follow-ups API
 * 
 * GET /api/crm/follow-ups - List follow-ups
 * POST /api/crm/follow-ups - Create a new follow-up
 */

import { NextRequest } from 'next/server';
import { followUpService } from '@/modules/crm/services/follow-up-service';
import {
  successResponse,
  internalErrorResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { createFollowUpSchema } from '@/lib/validation';

/**
 * GET /api/crm/follow-ups
 * List follow-ups (today's and overdue)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    
    let followUps;
    
    switch (filter) {
      case 'today':
        followUps = await followUpService.getTodaysFollowUps();
        break;
      case 'overdue':
        followUps = await followUpService.getOverdueFollowUps();
        break;
      default:
        // Return both today's and overdue
        const [today, overdue] = await Promise.all([
          followUpService.getTodaysFollowUps(),
          followUpService.getOverdueFollowUps(),
        ]);
        followUps = { today, overdue };
    }
    
    return successResponse(followUps);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

/**
 * POST /api/crm/follow-ups
 * Create a new follow-up
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = createFollowUpSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    const followUp = await followUpService.createFollowUp(result.data);
    
    return successResponse(followUp, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
