import { ApiClient } from '../http.js';
import { toQueryString } from '../qs.js';
import { StrapiQueryParams, StrapiSingleResponse } from '../types/strapi.js';
import { AboutUsPage } from '../types/entities.js';
import type { AboutUsPageUpdateInput } from '../types/inputs.js';

export async function getAboutUsPage(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<AboutUsPage>> {
  const qs = toQueryString({ ...params });
  return api.get(`/api/about-us-page`, qs);
}

export async function updateAboutUsPage(
  api: ApiClient,
  data: AboutUsPageUpdateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<AboutUsPage>> {
  const qs = toQueryString(params);
  return api.put(`/api/about-us-page${qs ? `?${qs}` : ''}`, { data });
}
