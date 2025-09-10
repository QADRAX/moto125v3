import { ApiClient } from '../http';
import { toQueryString } from '../qs';
import { Company } from '../types/entities';
import {
  StrapiCollectionResponse,
  StrapiQueryParams,
  StrapiSingleResponse,
} from '../types/strapi';

export const COMPANY_POPULATE: StrapiQueryParams['populate'] = {
  image: true,
};

export async function getCompanies(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<Company>> {
  const qs = toQueryString({
    populate: params.populate ?? COMPANY_POPULATE,
    sort: params.sort ?? ['name:asc'],
    ...params,
  });
  return api.get(`/api/companies`, qs);
}

export async function getCompanyById(
  api: ApiClient,
  documentId: string,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<Company>> {
  const qs = toQueryString({
    populate: params.populate ?? COMPANY_POPULATE,
    ...params,
  });
  return api.get(`/api/companies/${documentId}`, qs);
}
