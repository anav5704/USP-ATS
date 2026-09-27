import { NextResponse } from "next/server";
import {
  archiveJobPostingById,
  ArchiveJobError,
} from "@/lib/jobs/archive-job";
import { requireApiAdmin } from "@/lib/jobs/require-api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
  }

  try {
    const outcome = await archiveJobPostingById(id);
    if (!outcome) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }
    return NextResponse.json({ outcome });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ArchiveJobError
            ? error.message
            : "Unable to archive the job posting",
      },
      { status: error instanceof ArchiveJobError ? error.status : 500 }
    );
  }
}
