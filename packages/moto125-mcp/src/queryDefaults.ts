import type { StrapiQueryParams } from "@moto125/api-client";

/**
 * Listados ligeros por defecto (el SDK poblaría content/relaciones completas).
 * Si el caller pasa fields/populate/pagination, se respetan.
 */
export function withLightArticleListParams(
  params?: StrapiQueryParams
): StrapiQueryParams {
  return {
    filters: params?.filters,
    sort: params?.sort,
    publicationState: params?.publicationState,
    locale: params?.locale,
    fields: params?.fields ?? [
      "slug",
      "title",
      "publicationDate",
      "visible",
      "publishedAt",
      "updatedAt",
    ],
    populate: params?.populate ?? { articleType: true },
    pagination: {
      page: 1,
      pageSize: 25,
      withCount: true,
      ...params?.pagination,
    },
  };
}

export function withLightMotoListParams(
  params?: StrapiQueryParams
): StrapiQueryParams {
  return {
    filters: params?.filters,
    sort: params?.sort,
    publicationState: params?.publicationState,
    locale: params?.locale,
    fields: params?.fields ?? [
      "modelName",
      "fullName",
      "moto125Id",
      "active",
      "year",
      "engineType",
      "normativa",
      "priece",
      "publishedAt",
      "updatedAt",
    ],
    populate: params?.populate ?? { company: true },
    pagination: {
      page: 1,
      pageSize: 25,
      withCount: true,
      ...params?.pagination,
    },
  };
}

export function withLightCompanyListParams(
  params?: StrapiQueryParams
): StrapiQueryParams {
  return {
    filters: params?.filters,
    sort: params?.sort,
    publicationState: params?.publicationState,
    locale: params?.locale,
    fields: params?.fields ?? [
      "name",
      "active",
      "url",
      "publishedAt",
      "updatedAt",
    ],
    populate: params?.populate ?? undefined,
    pagination: {
      page: 1,
      pageSize: 25,
      withCount: true,
      ...params?.pagination,
    },
  };
}
