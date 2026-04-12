"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("./env");
const routes_1 = require("./routes");
const app = (0, fastify_1.default)({
    logger: true,
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
// Hook: Ler ou gerar requestId por request
app.decorateRequest('requestId', '');
app.addHook('onRequest', async (request, reply) => {
    const incomingId = request.headers['x-request-id'];
    request.requestId = incomingId || crypto_1.default.randomUUID();
    // Opcional: Anexar o requestId aos logs padrão do Fastify caso queira rastreabilidade profunda
    request.log = request.log.child({ reqId: request.requestId });
});
// Duck-typing para verificar se é um AppError válido (mesmo se falhar no instanceof por conta de transpilação/imports duplos)
function isAppError(err) {
    return (err !== null &&
        typeof err === 'object' &&
        typeof err.code === 'string' &&
        typeof err.statusCode === 'number' &&
        typeof err.message === 'string');
}
// Error Handler Padronizado
app.setErrorHandler((error, request, reply) => {
    if (isAppError(error)) {
        app.log.warn(`[${error.code}] ${error.message} (requestId: ${request.requestId})`);
        const isDev = process.env.NODE_ENV !== 'production';
        return reply.status(error.statusCode).send({
            code: error.code,
            message: error.message,
            details: isDev ? {
                ...(error.details || {}),
                message: error.message,
                stack: error.stack
            } : error.details,
            requestId: request.requestId
        });
    }
    // Loga apenas os erros inesperados com detalhes completos
    app.log.error({ err: error, requestId: request.requestId }, 'Erro Inesperado');
    // Fallback 500 para erros não mapeados
    reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Erro interno',
        requestId: request.requestId
    });
});
async function bootstrap() {
    try {
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
        await app.register(routes_1.appRoutes);
        await app.listen({ port: env_1.env.PORT, host: '0.0.0.0' });
        app.log.info(`Server running on http://localhost:${env_1.env.PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
bootstrap();
