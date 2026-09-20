import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jobInputSchema } from "@/lib/jobs/job-schema";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import {
  removeJobPostingById,
  RemoveJobError,
} from "@/lib/jobs/remove-job";
import {
  JobModificationError,
  requestJobModification,
} from "@/lib/jobs/job-modification";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
  }

  const raw: unknown = await request.json().catch(() => null);
  const parsed = jobInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid job posting data" },
      { status: 400 }
    );
  }

  try {
    const modification = await requestJobModification(
      prisma,
      id,
      guard.session.user.id,
      parsed.data
    );
    return NextResponse.json({ success: true, requestId: modification.id });
  } catch (error) {
    if (!(error instanceof JobModificationError)) {
      console.error("Unable to submit job modification", error);
    }
    return NextResponse.json(
      {
        error:
          error instanceof JobModificationError
            ? error.message
            : "Unable to submit the job modification",
      },
      { status: error instanceof JobModificationError ? error.status : 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
  }

  try {
    const outcome = await removeJobPostingById(id);
    if (!outcome) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }
    return NextResponse.json({ outcome });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof RemoveJobError
            ? error.message
            : "Unable to remove the job posting",
      },
      { status: error instanceof RemoveJobError ? error.status : 500 }
    );
  }
}
