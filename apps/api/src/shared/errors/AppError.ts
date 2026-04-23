// src/shared/errors/AppError.ts
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: string,
    statusCode: number,
    message: string,
    details?: unknown
  ) {
    super(message);

    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Necessário para instanceof funcionar corretamente
    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}