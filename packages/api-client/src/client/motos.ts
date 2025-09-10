import { ApiClient } from '../http';
import { toQueryString } from '../qs';
import {
  StrapiCollectionResponse,
  StrapiQueryParams,
  StrapiSingleResponse,
} from '../types/strapi';
import { MotoAttrs } from '../types/entities';

export const MOTO_POPULATE: StrapiQueryParams['populate'] = {
  images: true,
  company: true,
  motoType: { populate: ['motoClass'] },
  articles: { populate: ['coverImage', 'articleType'] },
};

export async function getMotos(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<MotoAttrs>> {
  const qs = toQueryString({
    populate: params.populate ?? MOTO_POPULATE,
    sort: params.sort ?? ['modelName:asc'],
    ...params,
  });
  return api.get(`/api/motos`, qs);
}

export async function getMotoByMoto125Id(
  api: ApiClient,
  moto125Id: string,
  params: Omit<StrapiQueryParams, 'filters'> = {}
): Promise<StrapiCollectionResponse<MotoAttrs>> {
  const qs = toQueryString({
    populate: params.populate ?? MOTO_POPULATE,
    filters: { moto125Id: { $eq: moto125Id } },
    pagination: { page: 1, pageSize: 1, withCount: false },
    ...params,
  });
  return api.get(`/api/motos`, qs);
}

export async function getMotoById(
  api: ApiClient,
  id: number,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<MotoAttrs>> {
  const qs = toQueryString({
    populate: params.populate ?? MOTO_POPULATE,
    ...params,
  });
  return api.get(`/api/motos/${id}`, qs);
}
