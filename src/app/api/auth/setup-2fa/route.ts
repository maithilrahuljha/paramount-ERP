/**
 * PMN ERP Platform - 2FA Setup API
 * 
 * POST /api/auth/setup-2fa - Generate 2FA setup (QR code, secret)
 * PUT /api/auth/setup-2fa - Enable 2FA with verification code
 */

import { NextRequest } from 'next/server';
import { authService } from '@/kernel/auth/auth-service';
import { successResponse, errorResponse, unauthorizedResponse, internalErrorResponse, validationErrorResponse } from '@/lib/api-response';
import { z } from 'zod';

const enable2FASchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

/**
 * POST - Generate 2FA setup
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user from token
    const cookieToken = request.cookies.get('auth_token')?.value;
    const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    const token = cookieToken ?? headerToken;
    
    if (!token) {
      return unauthorizedResponse('Authentication required');
    }
    
    const user = await authService.getCurrentUser(token);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }
    
    // Generate 2FA setup
    const setup = await authService.setupTwoFactor(user.id);
    
    if (!setup) {
      return errorResponse('SETUP_FAILED', 'Failed to generate 2FA setup', undefined, 500);
    }
    
    return successResponse({
      qrCode: setup.qrCode,
      secret: setup.secret,
      backupCodes: setup.backupCodes,
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

/**
 * PUT - Enable 2FA with verification code
 */
export async function PUT(request: NextRequest) {
  try {
    // Get current user from token
    const cookieToken = request.cookies.get('auth_token')?.value;
    const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    const token = cookieToken ?? headerToken;
    
    if (!token) {
      return unauthorizedResponse('Authentication required');
    }
    
    const user = await authService.getCurrentUser(token);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }
    
    const body = await request.json();
    
    // Validate input
    const result = enable2FASchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    
    // Enable 2FA
    const enabled = await authService.enableTwoFactor(user.id, result.data.code);
    
    if (!enabled) {
      return errorResponse('INVALID_CODE', 'Invalid verification code', undefined, 400);
    }
    
    return successResponse({ enabled: true });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
