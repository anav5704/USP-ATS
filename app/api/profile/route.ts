import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiMember } from "@/lib/jobs/require-api";
import { profileInputSchema } from "@/lib/profile/profile-schema";
import { buildProfileData, firstProfileError } from "@/lib/profile/profile-data";
import { diffProfileRows } from "@/lib/profile/profile-diff";
import { getProfileModel } from "@/lib/profile/profile-queries";
import { toProfileModel } from "@/lib/profile/to-profile-input";
import { deleteRemovedStoredFiles } from "@/lib/uploads/storage";

const PROFILE_INCLUDE = {
  degrees: { orderBy: { uploadedAt: "asc" as const } },
  certificates: true,
  socialLinks: true,
  profileLinks: true,
} as const;

export async function GET() {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  try {
    const profile = await getProfileModel(guard.session.user.id);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
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
      select: {
        id: true,
        degrees: {
          select: {
            id: true,
            name: true,
            gpa: true,
            documentType: true,
            fileName: true,
            stored: true,
            type: true,
            size: true,
          },
        },
        certificates: {
          select: {
            id: true,
            label: true,
            organization: true,
            url: true,
            uploadedAt: true,
            name: true,
            stored: true,
            type: true,
            size: true,
          },
        },
        socialLinks: { select: { id: true, platform: true, url: true } },
        profileLinks: { select: { id: true, title: true, url: true } },
      },
    });

    const userId = guard.session.user.id;
    if (!existing) {
      const result = await prisma.profile.create({
        data: {
          userId,
          ...buildProfileData(parsed.data, { replace: false }),
        },
        include: PROFILE_INCLUDE,
      });
      return NextResponse.json(toProfileModel(result));
    }

    const scalars = buildProfileData(parsed.data, { replace: false });
    const diff = diffProfileRows(existing, parsed.data);
    const result = await prisma.profile.update({
      where: { id: existing.id },
      data: {
        phone: scalars.phone,
        bio: scalars.bio,
        skills: scalars.skills,
        campuses: scalars.campuses,
        ...(diff.degrees ? { degrees: diff.degrees } : {}),
        ...(diff.certificates ? { certificates: diff.certificates } : {}),
        ...(diff.socialLinks ? { socialLinks: diff.socialLinks } : {}),
        ...(diff.profileLinks ? { profileLinks: diff.profileLinks } : {}),
      },
      include: PROFILE_INCLUDE,
    });

    if (diff.removedStored.length > 0) {
      const removed = diff.removedStored;
      after(() =>
        deleteRemovedStoredFiles(userId, removed).catch((error) => {
          console.error("Failed to prune removed profile files", {
            userId,
            error,
          });
        })
      );
    }

    return NextResponse.json(toProfileModel(result));
  } catch {
    return NextResponse.json(
      { error: "Unable to save your profile" },
      { status: 500 }
    );
  }
}