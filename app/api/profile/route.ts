import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiMember } from "@/lib/jobs/require-api";
import { profileInputSchema } from "@/lib/profile/profile-schema";
import {
  buildProfileData,
  firstProfileError,
} from "@/lib/profile/profile-data";
import { toProfileModel } from "@/lib/profile/to-profile-input";

export async function GET() {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  try {
    const result = await prisma.profile.findUnique({
      where: { userId: guard.session.user.id },
      include: {
        education: true,
        projects: true,
      },
    });

    if (!result) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(toProfileModel(result));
  } catch {
    return NextResponse.json({ error: "Unable to load profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  const raw: unknown = await request.json().catch(() => null);
  const parsed = profileInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstProfileError(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.profile.findUnique({
      where: { userId: guard.session.user.id },
      select: { id: true },
    });

    const result = existing
      ? await prisma.profile.update({
          where: { id: existing.id },
          data: buildProfileData(parsed.data, true),
          include: {
            education: true,
            projects: true,
          },
        })
      : await prisma.profile.create({
          data: {
            userId: guard.session.user.id,
            ...buildProfileData(parsed.data, false),
          },
          include: {
            education: true,
            projects: true,
          },
        });

    return NextResponse.json(toProfileModel(result));
  } catch {
    return NextResponse.json(
      { error: "Unable to save your profile" },
      { status: 500 }
    );
  }
}