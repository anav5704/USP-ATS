export type StudentJobFilters = {
  search: string;
  jobType: string;
  campuses: string[];
  gpaMin: string;
  degrees: string[];
  skills: string[];
};

export type AdminJobFilters = StudentJobFilters & {
  status: string;
};

export const EMPTY_STUDENT_JOB_FILTERS: StudentJobFilters = {
  search: "",
  jobType: "",
  campuses: [],
  gpaMin: "",
  degrees: [],
  skills: [],
};

export const EMPTY_ADMIN_JOB_FILTERS: AdminJobFilters = {
  ...EMPTY_STUDENT_JOB_FILTERS,
  status: "",
};

function readList(params: URLSearchParams, key: string): string[] {
  return params.getAll(key).filter((value) => value !== "");
}

function readStudentFilters(params: URLSearchParams): StudentJobFilters {
  return {
    search: params.get("search")?.trim() ?? "",
    jobType: params.get("jobType") ?? "",
    campuses: readList(params, "campuses"),
    gpaMin: params.get("gpaMin") ?? "",
    degrees: readList(params, "degrees"),
    skills: readList(params, "skills"),
  };
}

export function searchParamsToStudentJobFilters(
  params: URLSearchParams
): StudentJobFilters {
  return readStudentFilters(params);
}

export function searchParamsToAdminJobFilters(
  params: URLSearchParams
): AdminJobFilters {
  return {
    ...readStudentFilters(params),
    status: params.get("status") ?? "",
  };
}

export function jobFiltersToSearchParams(
  filters: StudentJobFilters | AdminJobFilters
): string {
  const params = new URLSearchParams();
  if (filters.search.trim() !== "") params.set("search", filters.search.trim());
  if (filters.jobType !== "") params.set("jobType", filters.jobType);
  for (const campus of filters.campuses) params.append("campuses", campus);
  if (filters.gpaMin !== "") params.set("gpaMin", filters.gpaMin);
  for (const degree of filters.degrees) params.append("degrees", degree);
  for (const skill of filters.skills) params.append("skills", skill);
  if ("status" in filters && filters.status !== "") {
    params.set("status", filters.status);
  }
  return params.toString();
}
