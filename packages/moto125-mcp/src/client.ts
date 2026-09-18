import { createMoto125Api, type Moto125Sdk } from "@moto125/api-client";
import { MediaLibrary, StrapiAdminHttp } from "@moto125/admin-api-client";
import { loadAdminEnv, loadContentEnv } from "./config.js";

let sdk: Moto125Sdk | null = null;
let media: MediaLibrary | null = null;

/**
 * SDK de contenido. Defaults alineados con migraciones editoriales:
 * preview (borradores visibles) + locale es (sitio en español).
 */
export function getSdk(): Moto125Sdk {
  if (sdk) return sdk;
  const { baseUrl, token } = loadContentEnv();
  sdk = createMoto125Api({
    baseUrl,
    token,
    queryDefaults: {
      publicationState: "preview",
      locale: "es",
    },
  });
  return sdk;
}

/** Media Library (Admin API). Lazy: solo si se usan tools de media. */
export function getMediaLibrary(): MediaLibrary {
  if (media) return media;
  const env = loadAdminEnv();
  const http = new StrapiAdminHttp({
    baseURL: env.baseUrl,
    token: env.token,
    email: env.email,
    password: env.password,
  });
  media = new MediaLibrary(http);
  return media;
}
