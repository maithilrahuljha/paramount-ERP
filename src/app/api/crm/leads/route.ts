/**
 * PMN ERP Platform - Leads API
 * 
 * RESTful API endpoints for lead management.
 * GET /api/crm/leads - List leads with filtering and pagination
 * POST /api/crm/leads - Create a new lead
 */

import { NextRequest } from 'next/server';
import { leadService } from '@/modules/crm/services/lead-service';
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  internalErrorResponse,
  validationErrorResponse,
  parsePaginationParams,
  parseSortParams,
} from '@/lib/api-response';
import { createLeadSchema, leadFiltersSchema } from '@/lib/validation';
import type { LeadFilters, LeadSortOptions } from '@/modules/crm/types';

/**
 * GET /api/crm/leads
 * List leads with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const pagination = parsePaginationParams(searchParams);
    
    // Parse sort
    const sort = parseSortParams(
      searchParams,
      ['createdAt', 'updatedAt', 'fullName', 'status', 'nextFollowUpAt', 'score'],
      'createdAt'
    ) as LeadSortOptions;
    
    // Parse filters
    const filterParams: Record<string, unknown> = {};
    
    const status = searchParams.get('status');
    if (status) {
      filterParams.status = status.includes(',') ? status.split(',') : status;
    }
    
    const stage = searchParams.get('stage');
    if (stage) {
      filterParams.stage = stage.includes(',') ? stage.split(',') : stage;
    }
    
    const leadSource = searchParams.get('leadSource');
    if (leadSource) {
      filterParams.leadSource = leadSource.includes(',') ? leadSource.split(',') : leadSource;
    }
    
    const assignedTo = searchParams.get('assignedTo');
    if (assignedTo) filterParams.assignedTo = assignedTo;
    
    const interestedCourse = searchParams.get('interestedCourse');
    if (interestedCourse) filterParams.interestedCourse = interestedCourse;
    
    const city = searchParams.get('city');
    if (city) filterParams.city = city;
    
    const priority = searchParams.get('priority');
    if (priority) filterParams.priority = priority;
    
    const search = searchParams.get('search');
    if (search) filterParams.search = search;
    
    const createdAfter = searchParams.get('createdAfter');
    if (createdAfter) filterParams.createdAfter = new Date(createdAfter);
    
    const createdBefore = searchParams.get('createdBefore');
    if (createdBefore) filterParams.createdBefore = new Date(createdBefore);
    
    // Validate filters
    const filterResult = leadFiltersSchema.safeParse(filterParams);
    if (!filterResult.success) {
      return validationErrorResponse(
        filterResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    const filters = filterResult.data as LeadFilters;
    
    // Get leads
    const result = await leadService.getLeads(filters, sort, pagination);
    
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
 * POST /api/crm/leads
 * Create a new lead
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = createLeadSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    // Create lead
    const leadData = {
      ...result.data,
      email: result.data.email ?? undefined,
    };
    const lead = await leadService.createLead(leadData);
    
    return successResponse(lead, undefined, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return errorResponse('DUPLICATE', error.message, undefined, 409);
    }
    return internalErrorResponse(error);
  }
}
