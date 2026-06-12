import { z } from "zod";

/**
 * Schema de validação do ambiente
 */
const envSchema = z.object({
  // Core
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3333),
  CORS_ORIGIN: z.string().default(""),

  // Gateways (Por capacidade)
  PRODUCTION_ORDER_GATEWAY: z.enum(["fake", "real"]).default("fake"),
  PRODUCT_STRUCTURE_GATEWAY: z.enum(["fake", "real"]).default("fake"),
  PRODUCT_CATALOG_GATEWAY: z.enum(["fake", "real"]).default("fake"),

  // Omie
  OMIE_APP_KEY: z.string().min(1),
  OMIE_APP_SECRET: z.string().min(1),
  OMIE_BASE_URL: z.string().url(),

  // Jobs
  ENABLE_STOCK_REFRESH_JOB: z.coerce.boolean().default(false),
  STOCK_REFRESH_CRON: z.string().default("*/5 * * * *"),

  ENABLE_OMIE_PRODUCT_SYNC_JOB: z.coerce.boolean().default(false),
  OMIE_PRODUCT_SYNC_CRON: z.string().default("*/30 * * * *"),

  OMIE_ORDERS_STAGE_SYNC: z.coerce.boolean().default(false),
  OMIE_ORDERS_STAGE20_CRON: z.string().default("*/10 * * * *"),

  OMIE_PRODUCTION_ORDERS_SYNC: z.coerce.boolean().default(false),
  OMIE_PRODUCTION_ORDERS_CRON: z.string().default("*/15 * * * *"),

  ENABLE_OMIE_CLIENT_SYNC_JOB: z.coerce.boolean().default(false),
  OMIE_CLIENT_SYNC_CRON: z.string().default("*/10 * * * *"),

  ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB: z.coerce.boolean().default(false),
  OMIE_PRODUCT_STRUCTURE_SYNC_CRON: z.string().default("*/20 * * * *"),

  ENABLE_OMIE_PRODUCT_CATALOG_SYNC_JOB: z.coerce.boolean().default(false),
  OMIE_PRODUCT_CATALOG_SYNC_CRON: z.string().default("0 */6 * * *"),
});

/**
 * Parse + valida process.env
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.format());
  throw new Error("Invalid environment configuration");
}

/**
 * Ambiente tipado e seguro
 */
export const env = parsed.data;