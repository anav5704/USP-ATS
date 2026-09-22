import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { approvalInputSchema } from "@/lib/jobs/approval-schema";
import {
  JobModificationError,
  reviewJobModification,
} from "@/lib/jobs/job-modification";

type RouteParams = {
  params: Promise<{ id: string; requestId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const parsed = approvalInputSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review" },
      { status: 400 }
    );
  }

  const { id: jobId, requestId } = await params;
  try {
    await reviewJobModification(
      prisma,
      jobId,
      requestId,
      guard.session.user.id,
      parsed.data
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof JobModificationError
            ? error.message
            : "Unable to review this modification",
      },
      { status: error instanceof JobModificationError ? error.status : 500 }
    );
  }
}
