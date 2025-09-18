export type PageInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevPage?: number;
  nextPage?: number;
};

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const slice = items.slice(start, end);

  const info: PageInfo = {
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    prevPage: safePage > 2 ? safePage - 1 : safePage > 1 ? 1 : undefined,
    nextPage: safePage < totalPages ? safePage + 1 : undefined,
  };

  return { slice, info };
}
