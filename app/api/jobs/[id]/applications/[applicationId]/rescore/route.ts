import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import type { scoreApplication } from "@/trigger/score-application";

type RouteParams = {
  params: Promise<{ id: string; applicationId: string }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id: jobId, applicationId } = await params;

  try {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, jobId },
      select: { id: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found for this job" },
        { status: 404 }
      );
    }

    // Reset to PENDING so the table shows a scoring state again instead of
    // the stale FAILED badge while the task is queued.
    await prisma.scoreResult.upsert({
      where: { applicationId },
      update: {
        status: "PENDING",
        matchScore: null,
        skillsScore: null,
        educationScore: null,
        motivationScore: null,
        eligible: null,
        qualificationFit: null,
        motivationFit: null,
        missingRequirements: [],
      },
      create: { applicationId, status: "PENDING", missingRequirements: [] },
    });

    const handle = await tasks.trigger<typeof scoreApplication>(
      "score-application",
      applicationId
    );

    return NextResponse.json({ success: true, runId: handle.id }, { status: 202 });
  } catch (error) {
    console.error("Failed to enqueue re-score", { applicationId, error });
    return NextResponse.json(
      { error: "Unable to queue re-scoring for this application" },
      { status: 500 }
    );
  }
}
