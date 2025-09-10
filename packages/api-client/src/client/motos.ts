import { ApiClient } from '../http.js';
import { toQueryString } from '../qs.js';
import {
  StrapiCollectionResponse,
  StrapiQueryParams,
  StrapiSingleResponse,
} from '../types/strapi.js';
import { Moto } from '../types/entities.js';
import type { MotoCreateInput, MotoUpdateInput } from '../types/inputs.js';

export const MOTO_POPULATE: StrapiQueryParams['populate'] = {
  images: true,
  company: true,
  motoType: { populate: ['motoClass'] },
  articles: { populate: ['coverImage', 'articleType'] },
};

/** ===== GET ===== */
export async function getMotos(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<Moto>> {
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
): Promise<StrapiCollectionResponse<Moto>> {
  const qs = toQueryString({
    populate: params.populate ?? MOTO_POPULATE,
    filters: { moto125Id: { $eq: moto125Id } },
    pagination: { page: 1, pageSize: 1, withCount: false },
    ...params,
  });
  return api.get(`/api/motos`, qs);
}

export async function getMotoByDocumentId(
  api: ApiClient,
  documentId: string,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<Moto>> {
  const qs = toQueryString({
    populate: params.populate ?? MOTO_POPULATE,
    ...params,
  });
  return api.get(`/api/motos/${documentId}`, qs);
}

/** ===== POST / PUT ===== */
export async function createMoto(
  api: ApiClient,
  data: MotoCreateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<Moto>> {
  const qs = toQueryString(params);
  return api.post(`/api/motos${qs ? `?${qs}` : ''}`, { data });
}

export async function updateMotoByDocumentId(
  api: ApiClient,
  documentId: string,
  data: MotoUpdateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<Moto>> {
  const qs = toQueryString(params);
  return api.put(`/api/motos/${documentId}${qs ? `?${qs}` : ''}`, { data });
}
