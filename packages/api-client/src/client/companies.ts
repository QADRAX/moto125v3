import { ApiClient } from '../http';
import { toQueryString } from '../qs';
import {
  StrapiCollectionResponse,
  StrapiQueryParams,
  StrapiSingleResponse,
} from '../types/strapi';
import { CompanyAttrs } from '../types/entities';

export const COMPANY_POPULATE: StrapiQueryParams['populate'] = {
  image: true,
};

export async function getCompanies(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<CompanyAttrs>> {
  const qs = toQueryString({
    populate: params.populate ?? COMPANY_POPULATE,
    sort: params.sort ?? ['name:asc'],
    ...params,
  });
  return api.get(`/api/companies`, qs);
}

export async function getCompanyById(
  api: ApiClient,
  id: number,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<CompanyAttrs>> {
  const qs = toQueryString({
    populate: params.populate ?? COMPANY_POPULATE,
    ...params,
  });
  return api.get(`/api/companies/${id}`, qs);
}
