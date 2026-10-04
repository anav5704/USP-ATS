import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireApiMember } from "@/lib/jobs/require-api";
import { createApplicationSchema } from "@/lib/applications/application-schema";
import { getMyApplications } from "@/lib/applications/application-list-queries";
import { searchParamsToMyApplicationFilters } from "@/lib/applications/application-filters";
import { parsePageParams, FEED_PAGE_SIZE } from "@/lib/pagination";
import {
  submitApplication,
  SubmitApplicationError,
} from "@/lib/applications/submit-application";
import type { scoreApplication } from "@/trigger/score-application";

export async function GET(request: NextRequest) {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  try {
    const params = request.nextUrl.searchParams;
    const { page, pageSize } = parsePageParams(params, FEED_PAGE_SIZE);
    return NextResponse.json(
      await getMyApplications(
        guard.session.user.id,
        searchParamsToMyApplicationFilters(params),
        page,
        pageSize
      )
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  const raw: unknown = await request.json().catch(() => null);
  const parsed = createApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid application data" },
      { status: 400 }
    );
  }

  try {
    const { applicationId } = await submitApplication(
      {
        applications: prisma.application,
        jobs: prisma.jobPosting,
        scoreResult: prisma.scoreResult,
        transact: (operations) => prisma.$transaction(operations),
      },
      guard.session.user.id,
      parsed.data
    );

    void tasks.trigger<typeof scoreApplication>("score-application", applicationId)
      .catch((error) => {
        console.error("Failed to enqueue scoring task", { applicationId, error });
      });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SubmitApplicationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You have already applied for this job" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Unable to submit the application" },
      { status: 500 }
    );
  }
}
