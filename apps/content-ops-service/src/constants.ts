/**
 * Default configuration values used by `config.ts`.
 * These should be the only defaults in the entire service.
 */
export const DEFAULTS = {
  PORT: 8080,

  LOG_LEVEL: "info" as const,
  LOG_BUFFER_SIZE: 1000,

  SYNC_MEDIA_ENABLED: true,
  SYNC_MEDIA_CRON: "0 5 * * *",
  SYNC_MEDIA_START_ON_BOOT: true,
  SYNC_MEDIA_CONCURRENCY: 4,

  SEC_WINDOW_SECONDS: 60, // 1 min sliding window
  SEC_RATE_CAPACITY: 120, // 120 reqs per minute
  SEC_TRUST_PROXY: true, // trust X-Forwarded-For
  SEC_AUTH_MAX_FAILS: 5, // 5 bad logins allowed
  SEC_AUTH_LOCKOUT_SECONDS: 300, // 5 minutes lockout
  SEC_MAX_TRACKED_KEYS: 10_000, // max IPs to keep in memory
  SEC_PRUNE_INTERVAL_SECONDS: 60, // prune every 1 min
};

/**
 * Environment variable names for consistency across codebase.
 */
export const ENV = {
  PORT: "PORT",
  LOG_LEVEL: "LOG_LEVEL",
  LOG_BUFFER_SIZE: "LOG_BUFFER_SIZE",
  STRAPI_ADMIN_BASE_URL: "STRAPI_ADMIN_BASE_URL",
  STRAPI_ADMIN_TOKEN: "STRAPI_ADMIN_TOKEN",
  STRAPI_ADMIN_EMAIL: "STRAPI_ADMIN_EMAIL",
  STRAPI_ADMIN_PASSWORD: "STRAPI_ADMIN_PASSWORD",
  AZURE_ACCOUNT: "AZURE_ACCOUNT",
  AZURE_KEY: "AZURE_KEY",
  AZURE_CONTAINER: "AZURE_CONTAINER",
  BASIC_AUTH_USER: "BASIC_AUTH_USER",
  BASIC_AUTH_PASSWORD: "BASIC_AUTH_PASSWORD",
};
