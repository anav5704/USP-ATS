import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { approvalInputSchema } from "@/lib/jobs/approval-schema";
import { reviewJob, ReviewError } from "@/lib/jobs/review-job";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;
  const parsed = approvalInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid review" }, { status: 400 });
  }
  try {
    await reviewJob(prisma.jobPosting, (await params).id, guard.session.user.id, parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof ReviewError ? error.message : "Unable to review this posting" },
      { status: error instanceof ReviewError ? error.status : 500 },
    );
  }
}
