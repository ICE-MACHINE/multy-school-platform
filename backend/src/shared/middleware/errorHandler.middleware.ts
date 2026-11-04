import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { t } from '../i18n/messages';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError) {
    if (!err.isOperational) {
      logger.error('Non-operational error:', { error: err.message, stack: err.stack });
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  const uploadErr = err as Error & { name?: string; code?: string };
  if (uploadErr.name === 'MulterError' || err.message === 'Unsupported file type') {
    res.status(uploadErr.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      success: false,
      message: uploadErr.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 10MB limit' : 'Unsupported file type',
    });
    return;
  }

  logger.error('Unexpected error:', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: t(req, 'internalError'),
  });
};