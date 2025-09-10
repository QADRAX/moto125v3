import { ApiClient } from '../http';
import { toQueryString } from '../qs';
import {
  StrapiCollectionResponse,
  StrapiQueryParams,
  StrapiSingleResponse,
} from '../types/strapi';
import { ArticleAttrs } from '../types/entities';

export const ARTICLE_POPULATE: StrapiQueryParams['populate'] = {
  coverImage: true,
  relatedMotos: { populate: ['images', 'company', 'motoType'] },
  relatedCompanies: { populate: ['image'] },
  articleType: true,
  content: { populate: '*' },
};

/** Fetch articles with optional filters/pagination. */
export async function getArticles(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<ArticleAttrs>> {
  const qs = toQueryString({
    populate: params.populate ?? ARTICLE_POPULATE,
    sort: params.sort ?? ['publicationDate:desc', 'createdAt:desc'],
    ...params,
  });
  return api.get(`/api/articles`, qs);
}

/** Fetch a single article by slug. */
export async function getArticleBySlug(
  api: ApiClient,
  slug: string,
  params: Omit<StrapiQueryParams, 'filters'> = {}
): Promise<StrapiSingleResponse<ArticleAttrs>> {
  const qs = toQueryString({
    populate: params.populate ?? ARTICLE_POPULATE,
    filters: { slug: { $eq: slug } },
    pagination: { page: 1, pageSize: 1, withCount: false },
    ...params,
  });
  return api.get(`/api/articles`, qs);
}

/** Fetch a single article by id. */
export async function getArticleById(
  api: ApiClient,
  id: number,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<ArticleAttrs>> {
  const qs = toQueryString({
    populate: params.populate ?? ARTICLE_POPULATE,
    ...params,
  });
  return api.get(`/api/articles/${id}`, qs);
}
