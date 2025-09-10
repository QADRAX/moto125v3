import { ApiClient } from '../http.js';
import { toQueryString } from '../qs.js';
import { Company } from '../types/entities.js';
import {
  StrapiCollectionResponse,
  StrapiQueryParams,
  StrapiSingleResponse,
} from '../types/strapi.js';
import type { CompanyCreateInput, CompanyUpdateInput } from '../types/inputs.js';

export const COMPANY_POPULATE: StrapiQueryParams['populate'] = {
  image: true,
};

/** ===== GET ===== */
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

export async function getCompanyById( // por documentId (mantengo nombre para compat)
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

/** ===== POST / PUT ===== */
export async function createCompany(
  api: ApiClient,
  data: CompanyCreateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<Company>> {
  const qs = toQueryString(params);
  return api.post(`/api/companies${qs ? `?${qs}` : ''}`, { data });
}

export async function updateCompanyByDocumentId(
  api: ApiClient,
  documentId: string,
  data: CompanyUpdateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<Company>> {
  const qs = toQueryString(params);
  return api.put(`/api/companies/${documentId}${qs ? `?${qs}` : ''}`, { data });
}
