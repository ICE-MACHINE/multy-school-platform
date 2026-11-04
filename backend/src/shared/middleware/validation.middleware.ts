import { Request, Response, NextFunction } from 'express';

type ValidationFunction = (data: any) => string | null;

export const validate = (validations: ValidationFunction[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const validation of validations) {
      const error = validation(req.body);
      if (error) {
        _res.status(400).json({
          success: false,
          message: error,
        });
        return;
      }
    }
    next();
  };
};

export const validateQuery = (validations: ValidationFunction[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const validation of validations) {
      const error = validation(req.query);
      if (error) {
        _res.status(400).json({
          success: false,
          message: error,
        });
        return;
      }
    }
    next();
  };
};

export const requiredField = (field: string) => {
  return (data: any): string | null => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      return `${field} is required`;
    }
    return null;
  };
};

export const minLength = (field: string, min: number) => {
  return (data: any): string | null => {
    if (data[field] && data[field].length < min) {
      return `${field} must be at least ${min} characters`;
    }
    return null;
  };
};

export const maxLength = (field: string, max: number) => {
  return (data: any): string | null => {
    if (data[field] && data[field].length > max) {
      return `${field} must not exceed ${max} characters`;
    }
    return null;
  };
};

export const isEmail = (field: string) => {
  return (data: any): string | null => {
    if (data[field]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data[field])) {
        return `${field} must be a valid email`;
      }
    }
    return null;
  };
};

export const isPhone = (field: string) => {
  return (data: any): string | null => {
    if (data[field]) {
      const phoneRegex = /^[0-9]{8,15}$/;
      if (!phoneRegex.test(data[field])) {
        return `${field} must be a valid phone number`;
      }
    }
    return null;
  };
};

export const isIn = (field: string, values: any[]) => {
  return (data: any): string | null => {
    if (data[field] && !values.includes(data[field])) {
      return `${field} must be one of: ${values.join(', ')}`;
    }
    return null;
  };
};