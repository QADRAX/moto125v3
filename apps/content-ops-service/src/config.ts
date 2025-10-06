import { z } from "zod";

/** Zod schema for environment configuration. */
const EnvSchema = z.object({
  PORT: z.coerce.number().default(8080),

  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
  LOG_BUFFER_SIZE: z.coerce.number().int().positive().default(1000),

  STRAPI_ADMIN_BASE_URL: z.string().url(), // OK en Zod v4
  STRAPI_ADMIN_TOKEN: z.string().optional(),
  STRAPI_ADMIN_EMAIL: z.string().email().optional(), // OK en Zod v4
  STRAPI_ADMIN_PASSWORD: z.string().optional(),

  AZURE_ACCOUNT: z.string(),
  AZURE_KEY: z.string(),
  AZURE_CONTAINER: z.string(),

  SYNC_MEDIA_ENABLED: z.coerce.boolean().default(true),
  SYNC_MEDIA_CRON: z.string().default("0 5 * * *"),
  SYNC_MEDIA_START_ON_BOOT: z.coerce.boolean().default(true),
  SYNC_MEDIA_CONCURRENCY: z.coerce.number().int().positive().default(4),

  BASIC_AUTH_USER: z.string(),
  BASIC_AUTH_PASSWORD: z.string(),
  BASIC_AUTH_MAX_FAILS: z.coerce.number().int().positive().default(5),
  BASIC_AUTH_LOCKOUT_SECONDS: z.coerce.number().int().positive().default(300),
  BASIC_AUTH_WINDOW_SECONDS: z.coerce.number().int().positive().default(900),
});

/** App configuration inferred from environment variables. */
export type AppConfig = z.infer<typeof EnvSchema>;

/** Loads and validates configuration from process.env. */
export function loadConfig(): AppConfig {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Zod v4: usar `issues` en lugar de `errors`
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`Invalid configuration: ${msg}`);
  }

  const cfg = parsed.data;

  // Ensure we have either token OR email+password for Strapi
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
