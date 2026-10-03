import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { getApprovals } from "@/lib/jobs/approval-queries";

export async function GET() {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  try {
    return NextResponse.json(await getApprovals(guard.session.user.id));
  } catch {
    return NextResponse.json(
      { error: "Unable to load approval requests" },
      { status: 500 }
    );
  }
}
