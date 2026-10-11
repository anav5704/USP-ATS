import { z } from "zod";
import { gpaFilterSchema } from "@/lib/jobs/gpa-filter-schema";
import { JOB_TYPES, USP_CAMPUSES_CENTRES } from "@/lib/jobs/job-constants";

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

const MAX_LIST_LENGTH = 20;

const campusSchema = z.enum(USP_CAMPUSES_CENTRES);
const jobTypeSchema = z.enum(JOB_TYPES);

// Enumerations and the GPA bound are validated here rather than trusted from
// the browser: unknown values and out-of-range numbers are discarded instead
// of reaching the query builder. Free text is left as entered.
function readEnumList<K extends string>(
  params: URLSearchParams,
  key: string,
  schema: z.ZodType<K>
): K[] {
  return params
    .getAll(key)
    .flatMap((value) => {
      const parsed = schema.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    })
    .slice(0, MAX_LIST_LENGTH);
}

function readFreeTextList(params: URLSearchParams, key: string): string[] {
  return params.getAll(key).filter((value) => value !== "").slice(0, MAX_LIST_LENGTH);
}

function readStudentFilters(params: URLSearchParams): StudentJobFilters {
  const parsedJobType = jobTypeSchema.safeParse(params.get("jobType") ?? "");
  const parsedGpaMin = gpaFilterSchema.safeParse(params.get("gpaMin") ?? "");

  return {
    search: params.get("search")?.trim() ?? "",
    jobType: parsedJobType.success ? parsedJobType.data : "",
    campuses: readEnumList(params, "campuses", campusSchema),
    gpaMin: parsedGpaMin.success ? parsedGpaMin.data : "",
    degrees: readFreeTextList(params, "degrees"),
    skills: readFreeTextList(params, "skills"),
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
