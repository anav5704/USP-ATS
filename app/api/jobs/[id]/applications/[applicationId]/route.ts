import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { updateApplicationStatusSchema } from "@/lib/applications/application-schema";
import { canAdminChangeStatus } from "@/lib/applications/application-rules";

type RouteParams = {
  params: Promise<{ id: string; applicationId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id: jobId, applicationId } = await params;
  const raw: unknown = await request.json().catch(() => null);
  const parsed = updateApplicationStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid application status" },
      { status: 400 }
    );
  }

  try {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, jobId },
      select: { id: true, status: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found for this job" },
        { status: 404 }
      );
    }

    if (!canAdminChangeStatus(application.status, parsed.data.status)) {
      return NextResponse.json(
        { error: "This application status can no longer be changed" },
        { status: 409 }
      );
    }

    const result = await prisma.application.updateMany({
      where: {
        id: application.id,
        jobId,
        status: application.status,
      },
      data: { status: parsed.data.status },
    });

    if (result.count !== 1) {
      return NextResponse.json(
        { error: "This application changed. Refresh and try again." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      id: application.id,
      status: parsed.data.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to update the application status" },
      { status: 500 }
    );
  }
}
