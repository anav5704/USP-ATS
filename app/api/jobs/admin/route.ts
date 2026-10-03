import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { getAdminJobList } from "@/lib/jobs/job-list-queries";
import { searchParamsToAdminJobFilters } from "@/lib/jobs/job-filters";

export async function GET(request: NextRequest) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  try {
    const filters = searchParamsToAdminJobFilters(request.nextUrl.searchParams);
    return NextResponse.json(await getAdminJobList(filters));
  } catch {
    return NextResponse.json(
      { error: "Unable to load job postings" },
      { status: 500 }
    );
  }
}
