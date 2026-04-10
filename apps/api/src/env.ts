import { z } from 'zod';
import { config } from 'dotenv';

// Carrega as variáveis do .env na raiz do apps/api
config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  OMIE_APP_KEY: z.string(),
  OMIE_APP_SECRET: z.string(),
  OMIE_BASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables.');
}

export const env = _env.data;

