/**
 * PMN ERP Platform - Authentication Service
 * 
 * Handles user authentication with:
 * - Email/Password login
 * - Two-Factor Authentication (2FA) using TOTP
 * - JWT token management
 * - Session management
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { hash, compare } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import * as QRCode from 'qrcode';
import { v4 as uuid } from 'uuid';
import { generateSecret, verifyTOTP, generateOTPAuthURI } from './totp';
import type { User } from '@/kernel/types';

// Configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'pmn-erp-secret-change-in-production'
);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '24h';
const TWO_FA_ISSUER = process.env.TWO_FA_ISSUER ?? 'PMN ERP Platform';
const SALT_ROUNDS = 12;

// Types
export interface LoginResult {
  success: boolean;
  requiresTwoFactor?: boolean;
  tempToken?: string;
  token?: string;
  user?: Omit<User, 'passwordHash'>;
  error?: string;
}

export interface TwoFactorSetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  type: 'access' | 'temp';
  iat: number;
  exp: number;
}

interface DBUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  passwordHash: string | null;
  roles: string[];
  permissions: string[];
  department: string | null;
  isActive: boolean;
  metadata: Record<string, unknown>;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Authentication Service
 */
export class AuthService {
  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      // Find user by email
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      const user = result[0] as DBUser | undefined;

      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      if (!user.isActive) {
        return { success: false, error: 'Account is disabled. Contact administrator.' };
      }

      if (!user.passwordHash) {
        return { success: false, error: 'Password not set. Contact administrator.' };
      }

      // Verify password
      const isValidPassword = await compare(password, user.passwordHash);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if 2FA is enabled
      const twoFactorEnabled = (user.metadata as { twoFactorEnabled?: boolean })?.twoFactorEnabled;
      
      if (twoFactorEnabled) {
        // Generate temporary token for 2FA verification
        const tempToken = await this.generateTempToken(user.id, user.email);
        return {
          success: true,
          requiresTwoFactor: true,
          tempToken,
        };
      }

      // Generate access token and create session
      const token = await this.generateAccessToken(user.id, user.email, user.roles);
      await this.createSession(user.id, token);
      await this.updateLastLogin(user.id);

      return {
        success: true,
        requiresTwoFactor: false,
        token,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Verify 2FA code
   */
  async verifyTwoFactor(tempToken: string, code: string): Promise<LoginResult> {
    try {
      // Verify temp token
      const payload = await this.verifyToken(tempToken);
      if (!payload || payload.type !== 'temp') {
        return { success: false, error: 'Invalid or expired verification session' };
      }

      // Get user
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      const user = result[0] as DBUser | undefined;
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify TOTP code
      const secret = (user.metadata as { twoFactorSecret?: string })?.twoFactorSecret;
      if (!secret) {
        return { success: false, error: '2FA not configured' };
      }

      const isValid = verifyTOTP(code, secret);
      if (!isValid) {
        // Check backup codes
        const backupCodes = (user.metadata as { backupCodes?: string[] })?.backupCodes ?? [];
        const codeIndex = backupCodes.indexOf(code.toUpperCase());
        
        if (codeIndex === -1) {
          return { success: false, error: 'Invalid verification code' };
        }

        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await db
          .update(users)
          .set({
            metadata: { ...user.metadata, backupCodes },
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      }

      // Generate access token
      const token = await this.generateAccessToken(user.id, user.email, user.roles);
      await this.createSession(user.id, token);
      await this.updateLastLogin(user.id);

      return {
        success: true,
        token,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      console.error('[AuthService] 2FA verification error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Set up 2FA for a user
   */
  async setupTwoFactor(userId: string): Promise<TwoFactorSetupResult | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const user = result[0] as DBUser | undefined;
      if (!user) {
        return null;
      }

      // Generate secret
      const secret = generateSecret();

      // Generate QR code
      const otpauth = generateOTPAuthURI(user.email, secret, TWO_FA_ISSUER);
      const qrCode = await QRCode.toDataURL(otpauth);

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      // Store secret and backup codes (not enabled yet)
      await db
        .update(users)
        .set({
          metadata: {
            ...user.metadata,
            twoFactorSecret: secret,
            backupCodes,
            twoFactorEnabled: false, // Will be enabled after verification
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { secret, qrCode, backupCodes };
    } catch (error) {
      console.error('[AuthService] 2FA setup error:', error);
      return null;
    }
  }

  /**
   * Enable 2FA after successful verification
   */
  async enableTwoFactor(userId: string, code: string): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const user = result[0] as DBUser | undefined;
      if (!user) {
        return false;
      }

      const secret = (user.metadata as { twoFactorSecret?: string })?.twoFactorSecret;
      if (!secret) {
        return false;
      }

      const isValid = verifyTOTP(code, secret);
      if (!isValid) {
        return false;
      }

      await db
        .update(users)
        .set({
          metadata: { ...user.metadata, twoFactorEnabled: true },
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error('[AuthService] Enable 2FA error:', error);
      return false;
    }
  }

  /**
   * Disable 2FA
   */
  async disableTwoFactor(userId: string, password: string): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const user = result[0] as DBUser | undefined;
      if (!user || !user.passwordHash) {
        return false;
      }

      const isValidPassword = await compare(password, user.passwordHash);
      if (!isValidPassword) {
        return false;
      }

      await db
        .update(users)
        .set({
          metadata: {
            ...user.metadata,
            twoFactorEnabled: false,
            twoFactorSecret: null,
            backupCodes: [],
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error('[AuthService] Disable 2FA error:', error);
      return false;
    }
  }

  /**
   * Logout - invalidate session
   */
  async logout(token: string): Promise<boolean> {
    try {
      await db.delete(sessions).where(eq(sessions.token, token));
      return true;
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
      return false;
    }
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(token: string): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const payload = await this.verifyToken(token);
      if (!payload || payload.type !== 'access') {
        return null;
      }

      // Check session exists
      const sessionResult = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.token, token),
            gt(sessions.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!sessionResult[0]) {
        return null;
      }

      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      const user = result[0] as DBUser | undefined;
      if (!user || !user.isActive) {
        return null;
      }

      return this.sanitizeUser(user);
    } catch (error) {
      console.error('[AuthService] Get current user error:', error);
      return null;
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const user = result[0] as DBUser | undefined;
      if (!user || !user.passwordHash) {
        return { success: false, error: 'User not found' };
      }

      const isValidPassword = await compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Validate new password
      if (newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
      }

      const newHash = await hash(newPassword, SALT_ROUNDS);

      await db
        .update(users)
        .set({
          passwordHash: newHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Invalidate all sessions
      await db.delete(sessions).where(eq(sessions.userId, userId));

      return { success: true };
    } catch (error) {
      console.error('[AuthService] Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    password: string;
    name: string;
    roles?: string[];
    department?: string;
  }): Promise<{ success: boolean; user?: Omit<User, 'passwordHash'>; error?: string }> {
    try {
      // Check if email exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email.toLowerCase()))
        .limit(1);

      if (existing[0]) {
        return { success: false, error: 'Email already registered' };
      }

      const passwordHash = await hash(data.password, SALT_ROUNDS);

      const result = await db
        .insert(users)
        .values({
          email: data.email.toLowerCase(),
          name: data.name,
          passwordHash,
          roles: data.roles ?? ['counsellor'],
          permissions: [],
          department: data.department,
          isActive: true,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const user = result[0] as DBUser;
      return { success: true, user: this.sanitizeUser(user) };
    } catch (error) {
      console.error('[AuthService] Create user error:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async generateAccessToken(
    userId: string,
    email: string,
    roles: string[]
  ): Promise<string> {
    return new SignJWT({ sub: userId, email, roles, type: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(JWT_SECRET);
  }

  private async generateTempToken(userId: string, email: string): Promise<string> {
    return new SignJWT({ sub: userId, email, roles: [], type: 'temp' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m') // Short expiration for 2FA
      .sign(JWT_SECRET);
  }

  private async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as unknown as JWTPayload;
    } catch {
      return null;
    }
  }

  private async createSession(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await db.insert(sessions).values({
      id: uuid(),
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    });
  }

  private async updateLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  private sanitizeUser(user: DBUser): Omit<User, 'passwordHash'> {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar ?? undefined,
      roles: user.roles,
      permissions: user.permissions,
      department: user.department ?? undefined,
      isActive: user.isActive,
      metadata: user.metadata,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
