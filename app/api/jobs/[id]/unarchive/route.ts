import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { unarchiveJobInputSchema } from "@/lib/jobs/job-schema";
import {
  unarchiveJobPosting,
  UnarchiveJobError,
} from "@/lib/jobs/unarchive-job";

const routeInputSchema = z.union([
  unarchiveJobInputSchema,
  z.object({}).strict(),
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const parsed = routeInputSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid unarchive request" },
      { status: 400 }
    );
  }

  const { id } = await params;
  try {
    const input =
      "deadline" in parsed.data && typeof parsed.data.deadline === "string"
        ? { deadline: parsed.data.deadline }
        : undefined;
    const result = await unarchiveJobPosting(
      prisma,
      id,
      guard.session.user.id,
      input
    );
    return NextResponse.json(result);
  } catch (error) {
    if (!(error instanceof UnarchiveJobError)) {
      console.error("Unable to unarchive job posting", error);
    }
    return NextResponse.json(
      {
        error:
          error instanceof UnarchiveJobError
            ? error.message
            : "Unable to unarchive the job posting",
      },
      { status: error instanceof UnarchiveJobError ? error.status : 500 }
    );
  }
}
