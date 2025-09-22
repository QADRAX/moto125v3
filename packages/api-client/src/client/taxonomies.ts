import { ApiClient } from '../http.js';
import { toQueryString } from '../qs.js';
import { ArticleType, MotoClass, MotoType } from '../types/entities.js';
import {
  StrapiCollectionResponse,
  StrapiQueryParams,
  StrapiSingleResponse,
} from '../types/strapi.js';
import type {
  ArticleTypeCreateInput,
  ArticleTypeUpdateInput,
  MotoTypeCreateInput,
  MotoTypeUpdateInput,
  MotoClassCreateInput,
  MotoClassUpdateInput,
} from '../types/inputs.js';

export const MOTO_CLASS_POPULATE: StrapiQueryParams['populate'] = {
  image: true
};

export const MOTO_TYPE_POPULATE: StrapiQueryParams['populate'] = {
  image: true
};

/** ===== GET ===== */
export async function getArticleTypes(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<ArticleType>> {
  const qs = toQueryString({ 
    ...params, 
    sort: params.sort ?? ['name:asc'] 
  });
  return api.get(`/api/article-types`, qs);
}

export async function getMotoTypes(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<MotoType>> {
  const qs = toQueryString({
    populate: params.populate ?? { motoClass: true, image: true },
    sort: params.sort ?? ['name:asc'],
    ...params,
  });
  return api.get(`/api/moto-types`, qs);
}

export async function getMotoClasses(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<MotoClass>> {
  const qs = toQueryString({ 
    ...params, 
    sort: params.sort ?? ['name:asc'],
    populate: params.populate ?? { image: true },
  });
  return api.get(`/api/moto-classes`, qs);
}

/** ===== POST / PUT ===== */
export async function createArticleType(
  api: ApiClient,
  data: ArticleTypeCreateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<ArticleType>> {
  const qs = toQueryString(params);
  return api.post(`/api/article-types${qs ? `?${qs}` : ''}`, { data });
}

export async function updateArticleTypeByDocumentId(
  api: ApiClient,
  documentId: string,
  data: ArticleTypeUpdateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<ArticleType>> {
  const qs = toQueryString(params);
  return api.put(`/api/article-types/${documentId}${qs ? `?${qs}` : ''}`, { data });
}

export async function createMotoType(
  api: ApiClient,
  data: MotoTypeCreateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<MotoType>> {
  const qs = toQueryString(params);
  return api.post(`/api/moto-types${qs ? `?${qs}` : ''}`, { data });
}

export async function updateMotoTypeByDocumentId(
  api: ApiClient,
  documentId: string,
  data: MotoTypeUpdateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<MotoType>> {
  const qs = toQueryString(params);
  return api.put(`/api/moto-types/${documentId}${qs ? `?${qs}` : ''}`, { data });
}

export async function createMotoClass(
  api: ApiClient,
  data: MotoClassCreateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<MotoClass>> {
  const qs = toQueryString(params);
  return api.post(`/api/moto-classes${qs ? `?${qs}` : ''}`, { data });
}

export async function updateMotoClassByDocumentId(
  api: ApiClient,
  documentId: string,
  data: MotoClassUpdateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<MotoClass>> {
  const qs = toQueryString(params);
  return api.put(`/api/moto-classes/${documentId}${qs ? `?${qs}` : ''}`, { data });
}
