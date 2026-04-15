"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const env_1 = require("./env");
const routes_1 = require("./routes");
const stockRefresh_job_1 = require("./jobs/stockRefresh.job");
// Duck-typing para verificar se é um AppError válido (mesmo se falhar no instanceof por conta de transpilação/imports duplos)
function isAppError(err) {
    return (err !== null &&
        typeof err === 'object' &&
        typeof err.code === 'string' &&
        typeof err.statusCode === 'number' &&
        typeof err.message === 'string');
}
async function buildApp() {
    const app = (0, fastify_1.default)({
        logger: process.env.NODE_ENV !== 'test',
        trustProxy: true,
    });
    const allowedOrigins = new Set(env_1.env.CORS_ORIGIN
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean));
    if (process.env.NODE_ENV !== 'production') {
        allowedOrigins.add('http://localhost:5173');
        allowedOrigins.add('http://localhost:5174');
        allowedOrigins.add('http://127.0.0.1:5173');
        allowedOrigins.add('http://127.0.0.1:5174');
    }
    await app.register(cors_1.default, {
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            if (allowedOrigins.has(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error(`Origin ${origin} not allowed by CORS`), false);
        },
    });
    // Hook: Ler ou gerar requestId por request
    app.decorateRequest('requestId', '');
    app.addHook('onRequest', async (request, reply) => {
        const incomingId = request.headers['x-request-id'];
        request.requestId = incomingId || crypto_1.default.randomUUID();
        // Opcional: Anexar o requestId aos logs padrão do Fastify caso queira rastreabilidade profunda
        if (process.env.NODE_ENV !== 'test') {
            request.log = request.log.child({ reqId: request.requestId });
        }
    });
    // Error Handler Padronizado
    app.setErrorHandler((error, request, reply) => {
        const requestId = request.requestId;
        const isDev = process.env.NODE_ENV !== 'production';
        if (error instanceof zod_1.ZodError) {
            const message = error.issues?.[0]?.message || 'Dados inválidos.';
            const details = isDev
                ? { ...error.format(), stack: error.stack }
                : error.format();
            return reply.status(400).send({
                error: {
                    code: 'VALIDATION_ERROR',
                    message,
                    details,
                    requestId,
                },
            });
        }
        if (isAppError(error)) {
            if (process.env.NODE_ENV !== 'test') {
                request.log.warn({ requestId }, `[${error.code}] ${error.message}`);
            }
            const details = isDev
                ? { ...(error.details || {}), stack: error.stack }
                : error.details;
            return reply.status(error.statusCode).send({
                error: {
                    code: error.code,
                    message: error.message,
                    ...(details ? { details } : {}),
                    requestId,
                },
            });
        }
        // Loga apenas os erros inesperados com detalhes completos
        if (process.env.NODE_ENV !== 'test') {
            request.log.error({ err: error, requestId }, 'Erro Inesperado');
        }
        // Fallback 500 para erros não mapeados
        reply.status(500).send({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erro interno',
                requestId,
            },
        });
    });
    await app.register(routes_1.appRoutes);
    (0, stockRefresh_job_1.startStockRefreshJob)(app);
    return app;
}
