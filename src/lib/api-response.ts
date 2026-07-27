/**
 * PMN ERP Platform - API Response Utilities
 * 
 * Standardized API response helpers for consistent API responses.
 */

import { NextResponse } from 'next/server';
import type { APIResponse, APIMeta } from '@/kernel/types';

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  meta?: Partial<APIMeta>,
  status: number = 200
): NextResponse<APIResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date(),
      },
    },
    { status }
  );
}

/**
 * Create a paginated API response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  },
  status: number = 200
): NextResponse<APIResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
        timestamp: new Date(),
      },
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  status: number = 400
): NextResponse<APIResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date(),
      },
    },
    { status }
  );
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  errors: Record<string, string[]>
): NextResponse<APIResponse<null>> {
  return errorResponse(
    'VALIDATION_ERROR',
    'Validation failed',
    { errors },
    422
  );
}

/**
 * Create a not found response
 */
export function notFoundResponse(
  resource: string,
  id?: string
): NextResponse<APIResponse<null>> {
  const message = id
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;
  return errorResponse('NOT_FOUND', message, undefined, 404);
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<APIResponse<null>> {
  return errorResponse('UNAUTHORIZED', message, undefined, 401);
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(
  message: string = 'Access denied'
): NextResponse<APIResponse<null>> {
  return errorResponse('FORBIDDEN', message, undefined, 403);
}

/**
 * Create an internal error response
 */
export function internalErrorResponse(
  error: unknown
): NextResponse<APIResponse<null>> {
  console.error('Internal server error:', error);
  return errorResponse(
    'INTERNAL_ERROR',
    'An internal server error occurred',
    process.env.NODE_ENV === 'development' && error instanceof Error
      ? { stack: error.stack }
      : undefined,
    500
  );
}

/**
 * Parse pagination params from request
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));
  return { page, pageSize };
}

/**
 * Parse sort params from request
 */
export function parseSortParams(
  searchParams: URLSearchParams,
  allowedFields: string[],
  defaultField: string = 'createdAt'
): { field: string; direction: 'asc' | 'desc' } {
  const sortBy = searchParams.get('sortBy') ?? defaultField;
  const sortOrder = searchParams.get('sortOrder') ?? 'desc';
  
  return {
    field: allowedFields.includes(sortBy) ? sortBy : defaultField,
    direction: sortOrder === 'asc' ? 'asc' : 'desc',
  };
}
