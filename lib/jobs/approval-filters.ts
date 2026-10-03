export type ApprovalTab = "mine" | "review";

export type ApprovalFilters = {
  search: string;
  requestType: string;
  status: string;
  campus: string;
  jobType: string;
};

export const EMPTY_APPROVAL_QUERY_FILTERS: ApprovalFilters = {
  search: "",
  requestType: "",
  status: "",
  campus: "",
  jobType: "",
};

export function searchParamsToApprovalFilters(
  params: URLSearchParams
): ApprovalFilters {
  return {
    search: params.get("search")?.trim() ?? "",
    requestType: params.get("requestType") ?? "",
    status: params.get("status") ?? "",
    campus: params.get("campus") ?? "",
    jobType: params.get("jobType") ?? "",
  };
}

export function approvalFiltersToSearchParams(
  filters: ApprovalFilters
): string {
  const params = new URLSearchParams();
  if (filters.search.trim() !== "") params.set("search", filters.search.trim());
  if (filters.requestType !== "") params.set("requestType", filters.requestType);
  if (filters.status !== "") params.set("status", filters.status);
  if (filters.campus !== "") params.set("campus", filters.campus);
  if (filters.jobType !== "") params.set("jobType", filters.jobType);
  return params.toString();
}
