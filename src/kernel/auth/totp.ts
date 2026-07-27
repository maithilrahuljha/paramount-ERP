/**
 * PMN ERP Platform - TOTP Implementation
 * 
 * Simple TOTP (Time-based One-Time Password) implementation
 * for Two-Factor Authentication.
 */

import crypto from 'crypto';

/**
 * Generate a random base32 secret
 */
export function generateSecret(length: number = 20): string {
  const bytes = crypto.randomBytes(length);
  return base32Encode(bytes);
}

/**
 * Generate a TOTP code
 */
export function generateTOTP(secret: string, time?: number): string {
  const counter = Math.floor((time ?? Date.now()) / 30000);
  return generateHOTP(secret, counter);
}

/**
 * Verify a TOTP code with time window tolerance
 */
export function verifyTOTP(token: string, secret: string, window: number = 1): boolean {
  const now = Math.floor(Date.now() / 30000);
  
  for (let i = -window; i <= window; i++) {
    const expected = generateHOTP(secret, now + i);
    if (timingSafeEqual(token, expected)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate otpauth URI for QR code
 */
export function generateOTPAuthURI(
  email: string,
  secret: string,
  issuer: string
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate HOTP (HMAC-based One-Time Password)
 */
function generateHOTP(secret: string, counter: number): string {
  const decodedSecret = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }
  
  const hmac = crypto.createHmac('sha1', decodedSecret);
  hmac.update(buffer);
  const digest = hmac.digest();
  
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Base32 encoding
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  
  return output;
}

/**
 * Base32 decoding
 */
function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanInput = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  
  for (let i = 0; i < cleanInput.length; i++) {
    const idx = alphabet.indexOf(cleanInput[i]);
    if (idx === -1) continue;
    
    value = (value << 5) | idx;
    bits += 5;
    
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return Buffer.from(output);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  return crypto.timingSafeEqual(bufA, bufB);
}
