import express from 'express';
import cookieParser from 'cookie-parser';
import { applySecurityMiddleware } from './shared/middleware/security.middleware';
import { requestLogger } from './shared/middleware/requestLogger.middleware';
import { errorHandler } from './shared/middleware/errorHandler.middleware';
import { generalLimiter, writeLimiter } from './shared/middleware/rateLimiter.middleware';
import { csrfProtection } from './shared/middleware/csrf.middleware';
import routes from './routes';
import { t } from './shared/i18n/messages';
import { env } from './config/env';

const app = express();

app.disable('etag');
app.disable('x-powered-by');
if (env.security.trustProxy) {
  app.set('trust proxy', 1);
}

applySecurityMiddleware(app);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(csrfProtection);
app.use(requestLogger);
app.use('/api', generalLimiter);
app.use('/api', (req, res, next) => (req.method === 'GET' ? next() : writeLimiter(req, res, next)));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: t(_req, 'notFound') });
});

app.use(errorHandler);

export default app;