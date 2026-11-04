import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { t } from '../i18n/messages';

const tooManyRequestsHandler = (req: any, res: any, _next: any, options: any): void => {
  res.status(options.statusCode).json({
    success: false,
    message: t(req, 'tooManyRequests'),
  });
};

export const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  handler: tooManyRequestsHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'محاولات دخول كثيرة جداً، يرجى المحاولة بعد 15 دقيقة',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  handler: tooManyRequestsHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  handler: tooManyRequestsHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  handler: tooManyRequestsHandler,
  standardHeaders: true,
  legacyHeaders: false,
});
