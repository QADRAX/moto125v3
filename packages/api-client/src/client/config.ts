import { ApiClient } from '../http.js';
import { toQueryString } from '../qs.js';
import { StrapiSingleResponse, StrapiQueryParams } from '../types/strapi.js';
import { Config } from '../types/entities.js';
import type { ConfigUpdateInput } from '../types/inputs.js';

/** GET (single type) */
export async function getConfig(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<Config>> {
  const qs = toQueryString({
    populate: params.populate ?? { DefaultAvatar: true },
    ...params,
  });
  return api.get(`/api/config`, qs);
}

/** PUT (single type) */
export async function updateConfig(
  api: ApiClient,
  data: ConfigUpdateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<Config>> {
  const qs = toQueryString(params);
  return api.put(`/api/config${qs ? `?${qs}` : ''}`, { data });
}
