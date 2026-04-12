"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = require("dotenv");
// Carrega as variáveis do .env na raiz do apps/api
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3333),
    DATABASE_URL: zod_1.z.string().url(),
    OMIE_APP_KEY: zod_1.z.string(),
    OMIE_APP_SECRET: zod_1.z.string(),
    OMIE_BASE_URL: zod_1.z.string().url(),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173,http://localhost:5174'),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error('❌ Invalid environment variables', _env.error.format());
    throw new Error('Invalid environment variables.');
}
exports.env = _env.data;
