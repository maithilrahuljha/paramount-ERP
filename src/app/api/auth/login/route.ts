/**
 * PMN ERP Platform - Login API
 * 
 * POST /api/auth/login - Authenticate user
 */

import { NextRequest } from 'next/server';
import { authService } from '@/kernel/auth/auth-service';
import { successResponse, errorResponse, internalErrorResponse, validationErrorResponse } from '@/lib/api-response';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    const { email, password } = result.data;
    
    // Attempt login
    const loginResult = await authService.login(email, password);
    
    if (!loginResult.success) {
      return errorResponse('AUTH_FAILED', loginResult.error ?? 'Authentication failed', undefined, 401);
    }
    
    // If 2FA required, return temp token
    if (loginResult.requiresTwoFactor) {
      return successResponse({
        requiresTwoFactor: true,
        tempToken: loginResult.tempToken,
      });
    }
    
    // Create response with auth cookie
    const response = successResponse({
      token: loginResult.token,
      user: loginResult.user,
    });
    
    // Set HTTP-only cookie for token
    response.cookies.set('auth_token', loginResult.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    return response;
  } catch (error) {
    return internalErrorResponse(error);
  }
}
