import {
  MediaLibrary,
  StrapiAdminHttp,
} from "@moto125/admin-api-client";

/** Create Strapi Admin HTTP + MediaLibrary (token or credentials). */
export async function createStrapiClients(opts: {
  baseURL: string;
  token?: string;
  email?: string;
  password?: string;
}) {
  const http = new StrapiAdminHttp({
    baseURL: opts.baseURL,
    token: opts.token,
    email: opts.email,
    password: opts.password,
  });
  if (!opts.token) {
    await http.login(); // uses email+password from constructor
  }
  const media = new MediaLibrary(http);
  return { http, media };
}
