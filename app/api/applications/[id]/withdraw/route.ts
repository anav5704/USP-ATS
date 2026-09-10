import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiMember } from "@/lib/jobs/require-api";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  try {
    const result = await prisma.application.updateMany({
      where: {
        id,
        studentId: guard.session.user.id,
        status: "APPLIED",
      },
      data: { status: "WITHDRAWN" },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "This application can no longer be withdrawn" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to withdraw the application" },
      { status: 500 }
    );
  }
}