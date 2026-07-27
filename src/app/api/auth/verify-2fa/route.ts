/**
 * PMN ERP Platform - 2FA Verification API
 * 
 * POST /api/auth/verify-2fa - Verify 2FA code
 */

import { NextRequest } from 'next/server';
import { authService } from '@/kernel/auth/auth-service';
import { successResponse, errorResponse, internalErrorResponse, validationErrorResponse } from '@/lib/api-response';
import { z } from 'zod';

const verify2FASchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  code: z.string().length(6, 'Code must be 6 digits').or(z.string().length(8, 'Backup code must be 8 characters')),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = verify2FASchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    const { tempToken, code } = result.data;
    
    // Verify 2FA
    const verifyResult = await authService.verifyTwoFactor(tempToken, code);
    
    if (!verifyResult.success) {
      return errorResponse('VERIFICATION_FAILED', verifyResult.error ?? 'Verification failed', undefined, 401);
    }
    
    // Create response with auth cookie
    const response = successResponse({
      token: verifyResult.token,
      user: verifyResult.user,
    });
    
    // Set HTTP-only cookie for token
    response.cookies.set('auth_token', verifyResult.token!, {
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
