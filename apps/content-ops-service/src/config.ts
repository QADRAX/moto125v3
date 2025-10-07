import { z } from "zod";
import { DEFAULTS } from "./constants";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(DEFAULTS.PORT),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default(DEFAULTS.LOG_LEVEL),
  LOG_BUFFER_SIZE: z.coerce.number().int().positive().default(DEFAULTS.LOG_BUFFER_SIZE),

  STRAPI_ADMIN_BASE_URL: z.string().url(),
  STRAPI_ADMIN_TOKEN: z.string().optional(),
  STRAPI_ADMIN_EMAIL: z.string().email().optional(),
  STRAPI_ADMIN_PASSWORD: z.string().optional(),

  AZURE_ACCOUNT: z.string(),
  AZURE_KEY: z.string(),
  AZURE_CONTAINER: z.string(),

  BASIC_AUTH_USER: z.string(),
  BASIC_AUTH_PASSWORD: z.string(),

  SEC_WINDOW_SECONDS: z.coerce.number().int().positive().default(DEFAULTS.SEC_WINDOW_SECONDS),
  SEC_RATE_CAPACITY: z.coerce.number().int().positive().default(DEFAULTS.SEC_RATE_CAPACITY),
  SEC_TRUST_PROXY: z.coerce.boolean().default(DEFAULTS.SEC_TRUST_PROXY),
  SEC_AUTH_MAX_FAILS: z.coerce.number().int().positive().default(DEFAULTS.SEC_AUTH_MAX_FAILS),
  SEC_AUTH_LOCKOUT_SECONDS: z
    .coerce.number()
    .int()
    .positive()
    .default(DEFAULTS.SEC_AUTH_LOCKOUT_SECONDS),
  SEC_MAX_TRACKED_KEYS: z.coerce.number().int().positive().default(DEFAULTS.SEC_MAX_TRACKED_KEYS),
  SEC_PRUNE_INTERVAL_SECONDS: z
    .coerce.number()
    .int()
    .positive()
    .default(DEFAULTS.SEC_PRUNE_INTERVAL_SECONDS),
});

export type AppConfig = z.infer<typeof EnvSchema>;

/** Loads and validates configuration from process.env. */
export function loadConfig(): AppConfig {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`Invalid configuration: ${msg}`);
  }

  const cfg = parsed.data;

  // Ensure we have either token OR email+password for Strapi Admin auth
  if (
    !cfg.STRAPI_ADMIN_TOKEN &&
    !(cfg.STRAPI_ADMIN_EMAIL && cfg.STRAPI_ADMIN_PASSWORD)
  ) {
    throw new Error(
      "Strapi admin auth: provide STRAPI_ADMIN_TOKEN or STRAPI_ADMIN_EMAIL + STRAPI_ADMIN_PASSWORD"
    );
  }

  return cfg;
}
