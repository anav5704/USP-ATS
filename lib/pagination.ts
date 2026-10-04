export const FEED_PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 15;

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function parsePageParams(
  params: URLSearchParams,
  defaultPageSize: number
): { page: number; pageSize: number } {
  const rawPage = Number(params.get("page"));
  const rawPageSize = Number(params.get("pageSize"));
  const page =
    Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize =
    Number.isInteger(rawPageSize) && rawPageSize > 0
      ? Math.min(rawPageSize, 50)
      : defaultPageSize;
  return { page, pageSize };
}

export function pagedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PageResult<T> {
  return { items, total, page, pageSize };
}
