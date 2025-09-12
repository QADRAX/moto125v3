import { StrapiCollectionResponse, StrapiQueryParams, StrapiSingleResponse } from "@moto125/api-client";

export const DEFAULT_PAGE_SIZE = 100;

/**
 * Fetch all pages of a Strapi collection with populate="*".
 */
export async function fetchAllCollection<T>(
  listFn: (params?: StrapiQueryParams) => Promise<StrapiCollectionResponse<T>>
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let lastMetaPage: number | undefined;

  while (true) {
    const params: StrapiQueryParams = {
      pagination: { page, pageSize: DEFAULT_PAGE_SIZE, withCount: true },
    };

    const resp: StrapiCollectionResponse<T> = await listFn(params);

    const data = resp?.data ?? [];
    if (!Array.isArray(data)) break;
    items.push(...data);

    const meta = resp?.meta?.pagination;
    if (!meta) {
      if (data.length < DEFAULT_PAGE_SIZE) break;
      page++;
      continue;
    }


    if (lastMetaPage !== undefined && meta.page === lastMetaPage) {
      break;
    }
    lastMetaPage = meta.page;

    if (meta.page >= meta.pageCount) break;

    page++;
  }

  return items;
}

/**
 * Unwrap Strapi single response safely with populate="*".
 * Returns `undefined` if empty.
 */
export async function safeSingle<T>(
  fn: (params: StrapiQueryParams) => Promise<StrapiSingleResponse<T>>
): Promise<T | undefined> {
  const resp = await fn({ populate: "*" });
  return resp?.data ?? undefined;
}
