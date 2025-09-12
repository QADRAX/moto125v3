import { ApiClient } from '../http.js';
import { toQueryString } from '../qs.js';
import { StrapiQueryParams, StrapiSingleResponse } from '../types/strapi.js';
import { PaginaOfertas } from '../types/entities.js';
import type { PaginaOfertasUpdateInput } from '../types/inputs.js';

const PAGINA_OFERTAS_POPULATE: StrapiQueryParams['populate'] = {};

export async function getPaginaOfertas(
  api: ApiClient,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<PaginaOfertas>> {
  const qs = toQueryString({
    populate: params.populate ?? PAGINA_OFERTAS_POPULATE,
    ...params,
  });
  return api.get(`/api/pagina-ofertas`, qs);
}

export async function updatePaginaOfertas(
  api: ApiClient,
  data: PaginaOfertasUpdateInput,
  params: StrapiQueryParams = {}
): Promise<StrapiSingleResponse<PaginaOfertas>> {
  const qs = toQueryString(params);
  return api.put(`/api/pagina-ofertas${qs ? `?${qs}` : ''}`, { data });
}
