import { ApiClient } from '../http.js';
import { toQueryString } from '../qs.js';
import {
  StrapiCollectionResponse,
  StrapiQueryParams,
  StrapiSingleResponse,
} from '../types/strapi.js';
import { Article } from '../types/entities.js';

export const ARTICLE_POPULATE: StrapiQueryParams['populate'] = {
  coverImage: true,
  relatedMotos: { populate: ['images', 'company', 'motoType'] },
  relatedCompanies: { populate: ['image'] },
  articleType: true,
  content: { populate: '*' },
  tags: true,
};

export async function getArticles(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<Article>> {
  const qs = toQueryString({
    populate: params.populate ?? ARTICLE_POPULATE,
    sort: params.sort ?? ['publicationDate:desc', 'createdAt:desc'],
    ...params,
  });
  return api.get(`/api/articles`, qs);
}

export async function getArticleBySlug(
  api: ApiClient,
  slug: string,
  params: Omit<StrapiQueryParams, 'filters'> = {}
): Promise<StrapiCollectionResponse<Article>> {
  const qs = toQueryString({
    populate: params.populate ?? ARTICLE_POPULATE,
    filters: { slug: { $eq: slug } },
    pagination: { page: 1, pageSize: 1, withCount: false },
    ...params,
  });
  return api.get(`/api/articles`, qs);
}

export async function getArticleByDocumentId(
  api: ApiClient,
  documentId: string,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<Article>> {
  const qs = toQueryString({
    populate: params.populate ?? ARTICLE_POPULATE,
    ...params,
  });
  return api.get(`/api/articles/${documentId}`, qs);
}
