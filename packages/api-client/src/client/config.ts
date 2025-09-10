import { ApiClient } from '../http';
import { toQueryString } from '../qs';
import { StrapiSingleResponse, StrapiQueryParams } from '../types/strapi';
import { Config } from '../types/entities';

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
