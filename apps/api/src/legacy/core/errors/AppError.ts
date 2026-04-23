export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(code: string, statusCode: number, message: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
