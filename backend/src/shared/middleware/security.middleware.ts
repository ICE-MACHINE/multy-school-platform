import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import compression from 'compression';
import { Express } from 'express';
import { env } from '../../config/env';

export const applySecurityMiddleware = (app: Express): void => {
  const isProduction = env.NODE_ENV === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'no-referrer' },
      // HSTS preload is opt-in only (env.security.hstsPreload): submitting to
      // the preload list is effectively irreversible and requires every
      // subdomain to serve HTTPS first. Default keeps includeSubDomains only.
      hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: env.security.hstsPreload }
        : false,
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
    }),
  );

  app.use(
    cors({
      origin: env.frontendUrl.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-School-Id', 'X-CSRF-Token'],
      exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining'],
      maxAge: 600,
    }),
  );

  app.use(hpp({ whitelist: [] }));
  app.use(compression());
};
