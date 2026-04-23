import { ErrorCode, ErrorCodes } from './http-errors';

export class AppError extends Error {
  public code: ErrorCode;
  public statusCode: number;
  public details?: any;

  constructor(
    code: ErrorCode,
    statusCode: number,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Manter a stack trace limpa (V8 apenas)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(ErrorCodes.NOT_FOUND, 404, `${resource} não encontrado(a).`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCodes.CONFLICT, 409, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.VALIDATION_ERROR, 400, message, details);
  }
}

export class MissingDefaultSectorError extends AppError {
  constructor() {
    super(
      ErrorCodes.MISSING_DEFAULT_SECTOR,
      400,
      'Produto não possui setor padrão. Informe o sectorId.'
    );
  }
}
