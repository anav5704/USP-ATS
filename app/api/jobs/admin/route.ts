import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { getAdminJobList } from "@/lib/jobs/job-list-queries";
import { searchParamsToAdminJobFilters } from "@/lib/jobs/job-filters";
import { parsePageParams, ADMIN_PAGE_SIZE } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  try {
    const params = request.nextUrl.searchParams;
    const filters = searchParamsToAdminJobFilters(params);
    const { page, pageSize } = parsePageParams(params, ADMIN_PAGE_SIZE);
    return NextResponse.json(await getAdminJobList(filters, page, pageSize));
  } catch {
    return NextResponse.json(
      { error: "Unable to load job postings" },
      { status: 500 }
    );
  }
}
