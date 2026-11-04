import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { t } from '../i18n/messages';
import { UserRole } from '../interfaces';
import { assertActorSchoolAccess } from '../tenant/tenantScope';
import { getSessionState, isTokenRevoked } from '../auth/sessionRevocation';
import { ACCESS_TOKEN_COOKIE } from '../auth/authCookies';

export function extractAccessToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.[ACCESS_TOKEN_COOKIE];
  return typeof cookieToken === 'string' && cookieToken ? cookieToken : null;
}

const PASSWORD_CHANGE_ALLOWED_PATHS = ['/auth/update-profile', '/auth/logout', '/auth/me', '/auth/logout-all'];

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  void (async () => {
    try {
      const token = extractAccessToken(req);
      if (!token) return next(ApiError.unauthorized(t(req, 'noToken')));

      const decoded = verifyAccessToken(token);

    // Central tenant isolation: resolveSchoolId runs before route auth on
    // every /:schoolId/* mount, so a token minted for school A can never
    // authenticate against school B — even on a route that forgot authorize().
    try {
      assertActorSchoolAccess(
        { id: decoded.id, role: decoded.role, schoolId: decoded.schoolId, slug: decoded.slug },
        (req as unknown as Record<string, unknown>).resolvedSchoolId as string | undefined,
        (req as unknown as Record<string, unknown>).schoolSlug as string | undefined,
      );
    } catch {
      return next(ApiError.forbidden(t(req, 'invalidToken')));
    }
      // Immediate revocation: the (30s-cached) account state must still exist,
      // be active, and carry the same tokenVersion as the token. Password
      // changes, deactivation and role/school changes bump tokenVersion,
      // which invalidates every previously issued token at the next check.
      const session = await getSessionState(decoded.role, decoded.id);
      if (isTokenRevoked(session, decoded.tv)) {
        return next(ApiError.unauthorized(t(req, 'invalidToken')));
      }
      if (session.mustChangePassword) {
        const path = `${req.baseUrl || ''}${req.path || ''}` || req.originalUrl || '';
        const allowed = PASSWORD_CHANGE_ALLOWED_PATHS.some((p) => path.includes(p));
        if (!allowed) {
          return next(new ApiError(403, 'Password change is required before continuing'));
        }
      }
      req.user = {
        id: decoded.id,
        role: decoded.role as UserRole,
        schoolId: decoded.schoolId,
        slug: decoded.slug,
      };
      next();
    } catch (error) {
      return next(ApiError.unauthorized(t(req, 'invalidToken')));
    }
  })();
};

export const authenticateRefreshToken = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const refreshToken =
      (req as Request & { cookies?: Record<string, string> }).cookies?.refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      return next(ApiError.unauthorized(t(req, 'refreshRequired')));
    }

    const decoded = verifyRefreshToken(refreshToken);
    req.user = {
      id: decoded.id,
      role: decoded.role as UserRole,
      schoolId: decoded.schoolId,
      slug: decoded.slug,
    };
    next();
  } catch (error) {
    return next(ApiError.unauthorized(t(req, 'invalidRefresh')));
  }
};