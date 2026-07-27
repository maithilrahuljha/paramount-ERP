/**
 * PMN ERP Platform - Lead Statistics API
 * 
 * GET /api/crm/leads/statistics - Get lead statistics
 */

import { leadService } from '@/modules/crm/services/lead-service';
import { successResponse, internalErrorResponse } from '@/lib/api-response';

/**
 * GET /api/crm/leads/statistics
 * Get lead statistics and analytics
 */
export async function GET() {
  try {
    const statistics = await leadService.getStatistics();
    return successResponse(statistics);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
