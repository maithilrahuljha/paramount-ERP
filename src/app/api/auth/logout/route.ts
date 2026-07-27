/**
 * PMN ERP Platform - Logout API
 * 
 * POST /api/auth/logout - Logout user
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/kernel/auth/auth-service';
import { successResponse, internalErrorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie or header
    const cookieToken = request.cookies.get('auth_token')?.value;
    const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    const token = cookieToken ?? headerToken;
    
    if (token) {
      await authService.logout(token);
    }
    
    // Create response and clear cookie
    const response = successResponse({ loggedOut: true });
    
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    return internalErrorResponse(error);
  }
}
