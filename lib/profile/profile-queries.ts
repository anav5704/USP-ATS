import { prisma } from "@/lib/prisma";
import { toProfileModel, type ProfileModel } from "@/lib/profile/to-profile-input";

const PROFILE_INCLUDE = {
  degrees: { orderBy: { uploadedAt: "asc" as const } },
  certificates: true,
  socialLinks: true,
  profileLinks: true,
} as const;

export async function getProfileModel(
  userId: string
): Promise<ProfileModel | null> {
  const result = await prisma.profile.findUnique({
    where: { userId },
    include: PROFILE_INCLUDE,
  });

  if (!result) return null;
  return toProfileModel(result);
}
