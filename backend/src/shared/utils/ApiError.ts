export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string): ApiError {
    return new ApiError(400, message);
  }

  static unauthorized(message: string = 'غير مصرح'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'ممنوع'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'المورد غير موجود'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static tooMany(message: string = 'طلبات كثيرة جداً'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message: string = 'خطأ داخلي في الخادم'): ApiError {
    return new ApiError(500, message, false);
  }
}