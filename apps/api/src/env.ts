import { z } from 'zod';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  OMIE_APP_KEY: z.string(),
  OMIE_APP_SECRET: z.string(),
  OMIE_BASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables.');
}

export const env = _env.data;
