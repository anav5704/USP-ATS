import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiMember } from "@/lib/jobs/require-api";
import { profileInputSchema } from "@/lib/profile/profile-schema";
import {
  buildProfileData,
  firstProfileError,
  referencedStoredFiles,
} from "@/lib/profile/profile-data";
import { toProfileModel } from "@/lib/profile/to-profile-input";
import { pruneStoredFiles } from "@/lib/uploads/storage";

const PROFILE_INCLUDE = {
  transcript: true,
  certificates: true,
  socialLinks: true,
  profileLinks: true,
} as const;

export async function GET() {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  try {
    const result = await prisma.profile.findUnique({
      where: { userId: guard.session.user.id },
      include: PROFILE_INCLUDE,
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
      select: { id: true, transcript: { select: { id: true } } },
    });

    const userId = guard.session.user.id;
    const result = existing
      ? await prisma.profile.update({
          where: { id: existing.id },
          data: buildProfileData(parsed.data, {
            replace: true,
            transcriptExists: existing.transcript !== null,
          }),
          include: PROFILE_INCLUDE,
        })
      : await prisma.profile.create({
          data: {
            userId,
            ...buildProfileData(parsed.data, { replace: false }),
          },
          include: PROFILE_INCLUDE,
        });

    await pruneStoredFiles(userId, referencedStoredFiles(parsed.data));

    return NextResponse.json(toProfileModel(result));
  } catch {
    return NextResponse.json(
      { error: "Unable to save your profile" },
      { status: 500 }
    );
  }
}