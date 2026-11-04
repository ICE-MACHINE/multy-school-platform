import { Response } from 'express';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalAmount?: number;
}

export class ResponseHandler {
  static success(res: Response, data: any, message?: string, statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
    });
  }

  static created(res: Response, data: any, message?: string): Response {
    return ResponseHandler.success(res, data, message, 201);
  }

  static paginated(res: Response, data: any[], pagination: PaginationMeta, message?: string): Response {
    return res.status(200).json({
      success: true,
      data,
      message,
      pagination,
    });
  }

  static error(res: Response, message: string, statusCode = 500): Response {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}