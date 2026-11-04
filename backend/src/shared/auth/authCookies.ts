import crypto from 'crypto';
import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { safeEqual } from '../utils/encryption';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

const ACCESS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type SameSite = 'lax' | 'strict' | 'none';

function sameSite(): SameSite {
  const value = (process.env.AUTH_COOKIE_SAMESITE || 'lax').toLowerCase();
  if (value === 'strict' || value === 'none') return value;
  return 'lax';
}

function baseCookieOptions(maxAge: number) {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSite(),
    path: '/api',
    maxAge,
  };
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export function issueAuthCookies(res: Response, tokens: AuthTokenPair): string {
  const csrfToken = generateCsrfToken();
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, baseCookieOptions(ACCESS_MAX_AGE_MS));
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions(REFRESH_MAX_AGE_MS),
    path: '/api/auth',
  });
  res.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: env.NODE_ENV === 'production',
    sameSite: sameSite(),
    path: '/',
    maxAge: REFRESH_MAX_AGE_MS,
  });
  return csrfToken;
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/api' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' });
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}

export function stripTokensFromAuthResult<T extends Record<string, unknown>>(result: T): Omit<T, 'accessToken' | 'refreshToken'> {
  const { accessToken: _a, refreshToken: _r, ...rest } = result;
  return rest;
}

export function sendAuthResult(
  res: Response,
  result: Record<string, unknown> & Partial<AuthTokenPair>,
  message = 'Login successful',
): Response {
  if (result.accessToken && result.refreshToken) {
    issueAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
  }
  return res.status(200).json({ success: true, data: stripTokensFromAuthResult(result), message });
}

export function readCookie(req: Request, name: string): string | null {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  const value = cookies?.[name];
  return typeof value === 'string' && value ? value : null;
}

export function isCsrfValid(req: Request): boolean {
  const cookieValue = readCookie(req, CSRF_COOKIE);
  const headerValue = req.headers[CSRF_HEADER];
  if (!cookieValue || typeof headerValue !== 'string' || !headerValue) return false;
  return safeEqual(cookieValue, headerValue);
}
