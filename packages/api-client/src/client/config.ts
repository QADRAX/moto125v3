import { ApiClient } from '../http.js';
import { toQueryString } from '../qs.js';
import { StrapiSingleResponse, StrapiQueryParams } from '../types/strapi.js';
import { Config } from '../types/entities.js';
import type { ConfigUpdateInput } from '../types/inputs.js';

const CONFIG_POPULATE: StrapiQueryParams['populate'] = {
  logo: true,
  favicon: true,
  metaImageDefault: true,
  openGraphImage: true,
  heroBannerImage: true,
};

export async function getConfig(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<Config>> {
  const qs = toQueryString({
    populate: params.populate ?? CONFIG_POPULATE,
    ...params,
  });
  return api.get(`/api/config`, qs);
}

export async function updateConfig(
  api: ApiClient,
  data: ConfigUpdateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<Config>> {
  const qs = toQueryString(params);
  return api.put(`/api/config${qs ? `?${qs}` : ''}`, { data });
}
