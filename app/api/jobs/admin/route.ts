import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { getAdminJobList } from "@/lib/jobs/job-list-queries";

export async function GET() {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  try {
    return NextResponse.json(await getAdminJobList());
  } catch {
    return NextResponse.json(
      { error: "Unable to load job postings" },
      { status: 500 }
    );
  }
}
