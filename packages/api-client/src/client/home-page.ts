import { ApiClient } from '../http.js';
import { toQueryString } from '../qs.js';
import { StrapiQueryParams, StrapiSingleResponse } from '../types/strapi.js';
import { HomePage } from '../types/entities.js';
import type { HomePageUpdateInput } from '../types/inputs.js';

export const HOME_PAGE_POPULATE: StrapiQueryParams['populate'] = {
  featuredArticles: {
    populate: {
      featuredArticle1: { populate: ['coverImage', 'articleType'] },
      featuredArticle2: { populate: ['coverImage', 'articleType'] },
      featuredArticle3: { populate: ['coverImage', 'articleType'] },
    },
  },
  top10speed: {
    populate: {
      top1: { populate: ['images', 'company', 'motoType'] },
      top2: { populate: ['images', 'company', 'motoType'] },
      top3: { populate: ['images', 'company', 'motoType'] },
      top4: { populate: ['images', 'company', 'motoType'] },
      top5: { populate: ['images', 'company', 'motoType'] },
      top6: { populate: ['images', 'company', 'motoType'] },
      top7: { populate: ['images', 'company', 'motoType'] },
      top8: { populate: ['images', 'company', 'motoType'] },
      top9: { populate: ['images', 'company', 'motoType'] },
      top10:{ populate: ['images', 'company', 'motoType'] },
    },
  },
};

export async function getHomePage(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<HomePage>> {
  const qs = toQueryString({
    populate: params.populate ?? HOME_PAGE_POPULATE,
    ...params,
  });
  return api.get(`/api/home-page`, qs);
}

export async function updateHomePage(
  api: ApiClient,
  data: HomePageUpdateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<HomePage>> {
  const qs = toQueryString(params);
  return api.put(`/api/home-page${qs ? `?${qs}` : ''}`, { data });
}
