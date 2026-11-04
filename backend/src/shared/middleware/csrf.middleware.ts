import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, isCsrfValid, readCookie } from '../auth/authCookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isLoginPath(path: string): boolean {
  return path.endsWith('/login');
}

export const csrfProtection = (req: Request, _res: Response, next: NextFunction): void => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (isLoginPath(req.path)) return next();

  const hasCookieAuth = Boolean(readCookie(req, ACCESS_TOKEN_COOKIE) || readCookie(req, REFRESH_TOKEN_COOKIE));
  if (!hasCookieAuth) return next();

  if (!isCsrfValid(req)) {
    return next(new ApiError(403, 'CSRF validation failed'));
  }
  return next();
};
