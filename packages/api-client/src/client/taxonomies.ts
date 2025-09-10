import { ApiClient } from '../http';
import { toQueryString } from '../qs';
import {
  StrapiCollectionResponse,
  StrapiQueryParams,
} from '../types/strapi';
import { ArticleTypeAttrs, MotoTypeAttrs, MotoClassAttrs } from '../types/entities';

export async function getArticleTypes(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<ArticleTypeAttrs>> {
  const qs = toQueryString({ ...params, sort: params.sort ?? ['name:asc'] });
  return api.get(`/api/article-types`, qs);
}

export async function getMotoTypes(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<MotoTypeAttrs>> {
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
): Promise<StrapiCollectionResponse<MotoClassAttrs>> {
  const qs = toQueryString({ ...params, sort: params.sort ?? ['name:asc'] });
  return api.get(`/api/moto-classes`, qs);
}
