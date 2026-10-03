import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import {
  getApprovalPage,
} from "@/lib/jobs/approval-queries";
import {
  searchParamsToApprovalFilters,
  type ApprovalTab,
} from "@/lib/jobs/approval-filters";
import { parsePageParams, ADMIN_PAGE_SIZE } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  try {
    const params = request.nextUrl.searchParams;
    const tabParam = params.get("tab");
    const tab: ApprovalTab = tabParam === "review" ? "review" : "mine";
    const { page, pageSize } = parsePageParams(params, ADMIN_PAGE_SIZE);
    return NextResponse.json(
      await getApprovalPage(
        guard.session.user.id,
        searchParamsToApprovalFilters(params),
        tab,
        page,
        pageSize
      )
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load approval requests" },
      { status: 500 }
    );
  }
}
