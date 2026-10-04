import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import {
  AdminApplicantsNotFoundError,
  getAdminApplicants,
} from "@/lib/applications/admin-applicants-queries";
import { parsePageParams, ADMIN_PAGE_SIZE } from "@/lib/pagination";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  try {
    const { page, pageSize } = parsePageParams(
      request.nextUrl.searchParams,
      ADMIN_PAGE_SIZE
    );
    return NextResponse.json(await getAdminApplicants(id, page, pageSize));
  } catch (error) {
    if (error instanceof AdminApplicantsNotFoundError) {
      return NextResponse.json(
        { error: "Job posting not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Unable to load applicants" },
      { status: 500 }
    );
  }
}
