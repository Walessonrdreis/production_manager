"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingDefaultSectorError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.AppError = void 0;
const errors_1 = require("./errors");
class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(code, statusCode, message, details) {
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
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource) {
        super(errors_1.ErrorCodes.NOT_FOUND, 404, `${resource} não encontrado(a).`);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(errors_1.ErrorCodes.CONFLICT, 409, message);
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(errors_1.ErrorCodes.VALIDATION_ERROR, 400, message, details);
    }
}
exports.ValidationError = ValidationError;
class MissingDefaultSectorError extends AppError {
    constructor() {
        super(errors_1.ErrorCodes.MISSING_DEFAULT_SECTOR, 400, 'Produto não possui setor padrão. Informe o sectorId.');
    }
}
exports.MissingDefaultSectorError = MissingDefaultSectorError;
