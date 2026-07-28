import { z } from "zod";

/**
 * ✅ Parser seguro para boolean
 * Corrige problema do z.coerce.boolean() com "false"
 */
const envBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const v = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(v)) return true;
    if (["false", "0", "no", "off", ""].includes(v)) return false;
  }

  return false;
}, z.boolean());

/**
 * Schema de validação do ambiente
 */
const envSchema = z.object({
  // Core
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  PORT: z.coerce.number().default(3333),
  CORS_ORIGIN: z.string().default(""),

  // Gateways (Por capacidade)
  PRODUCTION_ORDER_GATEWAY: z.enum(["fake", "real"]).default("fake"),
  PRODUCT_STRUCTURE_GATEWAY: z.enum(["fake", "real"]).default("fake"),
  PRODUCT_CATALOG_GATEWAY: z.enum(["fake", "real"]).default("fake"),
  SALES_ORDER_SYNC_GATEWAY: z.enum(["fake", "real"]).default("fake"),

  // ✅ módulo product-stock-fetch
  PRODUCT_STOCK_FETCH_GATEWAY: z.enum(["fake", "real"]).default("fake"),

  // Omie
  OMIE_APP_KEY: z.string().min(1),
  OMIE_APP_SECRET: z.string().min(1),
  OMIE_BASE_URL: z.string().url(),

  // Jobs

  // ✅ módulo product-stock-fetch
  ENABLE_OMIE_PRODUCT_STOCK_FETCH_REFRESH_JOB: envBoolean.default(false),
  PRODUCT_STOCK_FETCH_REFRESH_CRON: z.string().default("*/30 * * * *"),

  ENABLE_OMIE_PRODUCT_SYNC_JOB: envBoolean.default(false),
  OMIE_PRODUCT_SYNC_CRON: z.string().default("*/30 * * * *"),

  OMIE_ORDERS_STAGE_SYNC: envBoolean.default(false),
  OMIE_ORDERS_STAGE20_CRON: z.string().default("*/10 * * * *"),

  OMIE_PRODUCTION_ORDERS_SYNC: envBoolean.default(false),
  OMIE_PRODUCTION_ORDERS_CRON: z.string().default("*/15 * * * *"),

  ENABLE_OMIE_CLIENT_SYNC_JOB: envBoolean.default(false),
  OMIE_CLIENT_SYNC_CRON: z.string().default("*/10 * * * *"),

  ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB: envBoolean.default(false),
  OMIE_PRODUCT_STRUCTURE_SYNC_CRON: z.string().default("*/20 * * * *"),

  // ✅ módulo product-structure (queue processor)
  ENABLE_OMIE_PRODUCT_STRUCTURE_QUEUE_JOB: envBoolean.default(false),
  OMIE_PRODUCT_STRUCTURE_QUEUE_CRON: z.string().default("* * * * * *"),

  ENABLE_OMIE_PRODUCT_CATALOG_SYNC_JOB: envBoolean.default(false),
  OMIE_PRODUCT_CATALOG_SYNC_CRON: z.string().default("0 */6 * * *"),

  // ✅ módulo production-orders (sync-global)
  ENABLE_OMIE_PRODUCTION_ORDER_SYNC_JOB: envBoolean.default(false),
  OMIE_PRODUCTION_ORDER_SYNC_CRON: z.string().default("*/15 * * * *"),

  // ✅ módulo production-orders (full daily sync — 00:00)
  ENABLE_OMIE_PRODUCTION_ORDER_FULL_SYNC_JOB: envBoolean.default(false),
  OMIE_PRODUCTION_ORDER_FULL_SYNC_CRON: z.string().default("0 0 * * *"),

  // ✅ módulo production-orders (queue processor)
  ENABLE_OMIE_PRODUCTION_ORDER_QUEUE_JOB: envBoolean.default(false),
  OMIE_PRODUCTION_ORDER_QUEUE_CRON: z.string().default("* * * * * *"),

  // ✅ módulo production-orders (read-model refresh)
  ENABLE_OMIE_PRODUCTION_ORDER_READ_MODEL_REFRESH_JOB: envBoolean.default(false),
  OMIE_PRODUCTION_ORDER_READ_MODEL_REFRESH_CRON: z.string().default("*/5 * * * *"),

  // ✅ módulo production-orders (read-model full refresh — Fase 4)
  ENABLE_OMIE_PRODUCTION_ORDER_READ_MODEL_FULL_REFRESH_JOB: envBoolean.default(false),
  OMIE_PRODUCTION_ORDER_READ_MODEL_FULL_REFRESH_CRON: z.string().default("0 0 * * *"),

  ENABLE_OMIE_PRODUCT_CATALOG_PRODUCTION_READY_REFRESH_JOB: envBoolean.default(false),
  OMIE_PRODUCT_CATALOG_PRODUCTION_READY_REFRESH_CRON: z.string().default("30 */10 * * * *"),

  FORCE_PRODUCTION_READY_REFRESH_ON_SYNC: envBoolean.default(false),

  // ✅ módulo sales-order-sync
  ENABLE_OMIE_SALES_ORDER_SYNC_JOB: envBoolean.default(false),
  OMIE_SALES_ORDER_SYNC_CRON: z.string().default("0 */10 * * * *"),

  // ✅ módulo customer-sync
  CUSTOMER_SYNC_GATEWAY: z.enum(["fake", "real"]).default("fake"),
  ENABLE_OMIE_CUSTOMER_SYNC_JOB: envBoolean.default(false),
  OMIE_CUSTOMER_SYNC_CRON: z.string().default("0 */12 * * *"),

  // PgBoss (Job Queue Centralizada - ADR-009)
  PG_BOSS_CONNECTION_STRING: z.string().optional(),
  PG_BOSS_CONCURRENCY: z.coerce.number().default(1),
  /** Polling interval interno do PgBoss em segundos (pollingIntervalSeconds nos work options). Padrão: 2s */
  PG_BOSS_SCHEDULE_INTERVAL: z.coerce.number().default(2),
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

/** Garantir que PgBoss use DIRECT_URL (DDL não passa pelo PgBouncer porta 6543) */
if (!parsed.data.PG_BOSS_CONNECTION_STRING && parsed.data.DIRECT_URL) {
  parsed.data.PG_BOSS_CONNECTION_STRING = parsed.data.DIRECT_URL;
}

/**
 * Ambiente tipado e seguro
 */
export const env = parsed.data;