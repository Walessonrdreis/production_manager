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
  ENABLE_PRODUCT_STOCK_FETCH_REFRESH_JOB: envBoolean.default(false),
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

  ENABLE_OMIE_PRODUCT_CATALOG_SYNC_JOB: envBoolean.default(false),
  OMIE_PRODUCT_CATALOG_SYNC_CRON: z.string().default("0 */6 * * *"),

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