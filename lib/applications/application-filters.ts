export type MyApplicationFilters = {
  search: string;
  status: string;
};

export const EMPTY_MY_APPLICATION_FILTERS: MyApplicationFilters = {
  search: "",
  status: "",
};

export function searchParamsToMyApplicationFilters(
  params: URLSearchParams
): MyApplicationFilters {
  return {
    search: params.get("search")?.trim() ?? "",
    status: params.get("status") ?? "",
  };
}

export function myApplicationFiltersToSearchParams(
  filters: MyApplicationFilters
): string {
  const params = new URLSearchParams();
  if (filters.search.trim() !== "") params.set("search", filters.search.trim());
  if (filters.status !== "") params.set("status", filters.status);
  return params.toString();
}
