import { ApiClient } from '../http';
import { toQueryString } from '../qs';
import { ArticleType, MotoClass, MotoType } from '../types/entities';
import {
  StrapiCollectionResponse,
  StrapiQueryParams,
} from '../types/strapi';

export async function getArticleTypes(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<ArticleType>> {
  const qs = toQueryString({ ...params, sort: params.sort ?? ['name:asc'] });
  return api.get(`/api/article-types`, qs);
}

export async function getMotoTypes(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<MotoType>> {
  const qs = toQueryString({
    populate: params.populate ?? { motoClass: true },
    sort: params.sort ?? ['name:asc'],
    ...params,
  });
  return api.get(`/api/moto-types`, qs);
}

export async function getMotoClasses(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<MotoClass>> {
  const qs = toQueryString({ ...params, sort: params.sort ?? ['name:asc'] });
  return api.get(`/api/moto-classes`, qs);
}
