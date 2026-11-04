import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { ApiError } from '../../shared/utils/ApiError';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { ChatHistoryItem, normalizeLocale, superAdminAssistantService } from './superAdminAssistant.service';

function getLocale(req: Request): string {
  const body = req.body as Record<string, unknown> | undefined;
  const bodyLocale = body?.locale;
  if (typeof bodyLocale === 'string' && bodyLocale.trim().length > 0) {
    return normalizeLocale(bodyLocale);
  }
  const queryLocale = req.query?.locale;
  if (typeof queryLocale === 'string' && queryLocale.trim().length > 0) {
    return normalizeLocale(queryLocale);
  }
  const header = req.headers['accept-language'];
  if (typeof header === 'string' && header.trim().length > 0) {
    return normalizeLocale(header.split(',')[0].split(';')[0].trim());
  }
  return 'en';
}

function sanitizeHistory(value: unknown): ChatHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is ChatHistoryItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        ((item as ChatHistoryItem).role === 'user' || (item as ChatHistoryItem).role === 'assistant') &&
        typeof (item as ChatHistoryItem).content === 'string' &&
        (item as ChatHistoryItem).content.trim().length > 0,
    )
    .slice(-10)
    .map((item) => ({ role: item.role, content: item.content.slice(0, 2000) }));
}

export class SuperAdminAiController {
  static getBriefing = asyncHandler(async (req: Request, res: Response) => {
    const result = await superAdminAssistantService.getBriefing(getLocale(req));
    return ResponseHandler.success(res, result);
  });

  static getTrends = asyncHandler(async (_req: Request, res: Response) => {
    const result = await superAdminAssistantService.getTrends();
    return ResponseHandler.success(res, result);
  });

  static getInsights = asyncHandler(async (req: Request, res: Response) => {
    const result = await superAdminAssistantService.getInsights(getLocale(req));
    return ResponseHandler.success(res, result);
  });

  static chat = asyncHandler(async (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const rawMessage = body.message;
    if (typeof rawMessage !== 'string' || rawMessage.trim().length === 0) {
      throw ApiError.badRequest('message is required and must be a non-empty string');
    }
    const message = rawMessage.trim().slice(0, 2000);
    const history = sanitizeHistory(body.history);
    const result = await superAdminAssistantService.chat(message, history, getLocale(req));
    return ResponseHandler.success(res, result);
  });
}
