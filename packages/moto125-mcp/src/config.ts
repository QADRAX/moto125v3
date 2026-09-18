export interface ContentEnv {
  baseUrl: string;
  token: string;
}

export interface AdminEnv {
  baseUrl: string;
  token?: string;
  email?: string;
  password?: string;
}

/**
 * Credenciales Content API (mismas que migraciones / api-client).
 */
export function loadContentEnv(): ContentEnv {
  const baseUrl = (
    process.env.STRAPI_API_URL ??
    process.env.MOTO125_API_URL ??
    ""
  ).replace(/\/$/, "");

  const token =
    process.env.STRAPI_API_TOKEN ?? process.env.MOTO125_TOKEN ?? "";

  const missing: string[] = [];
  if (!baseUrl) missing.push("STRAPI_API_URL (o MOTO125_API_URL)");
  if (!token) missing.push("STRAPI_API_TOKEN (o MOTO125_TOKEN)");
  if (missing.length) {
    throw new Error(
      `Faltan variables de entorno para el Content API: ${missing.join(", ")}`
    );
  }

  return { baseUrl, token };
}

/**
 * Credenciales Admin API (mismas que packages/migration).
 * Token directo o email+password (login).
 */
export function loadAdminEnv(): AdminEnv {
  const baseUrl = (
    process.env.STRAPI_API_URL ??
    process.env.MOTO125_API_URL ??
    ""
  ).replace(/\/$/, "");

  const token = process.env.STRAPI_ADMIN_TOKEN;
  const email = process.env.STRAPI_ADMIN_EMAIL;
  const password = process.env.STRAPI_ADMIN_PASSWORD;

  if (!baseUrl) {
    throw new Error(
      "Falta STRAPI_API_URL (o MOTO125_API_URL) para el Admin API"
    );
  }

  if (!token && !(email && password)) {
    throw new Error(
      "Para Media Library hace falta STRAPI_ADMIN_TOKEN o STRAPI_ADMIN_EMAIL + STRAPI_ADMIN_PASSWORD"
    );
  }

  return { baseUrl, token, email, password };
}
