/**
 * PMN ERP Platform - Current User API
 * 
 * GET /api/auth/me - Get current authenticated user
 */

import { NextRequest } from 'next/server';
import { authService } from '@/kernel/auth/auth-service';
import { successResponse, unauthorizedResponse, internalErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or header
    const cookieToken = request.cookies.get('auth_token')?.value;
    const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    const token = cookieToken ?? headerToken;
    
    if (!token) {
      return unauthorizedResponse('No authentication token provided');
    }
    
    const user = await authService.getCurrentUser(token);
    
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }
    
    return successResponse({ user });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
