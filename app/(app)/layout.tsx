import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { toProfileModel } from "@/lib/profile/to-profile-input";
import { AuthProvider } from "@/components/auth-provider";
import { RequireAuth } from "@/lib/require-auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCachedSession();

  if (
    session &&
    session.user.role !== "admin" &&
    session.user.role !== "member"
  ) {
    redirect("/access-denied");
  }

  let profile: ReturnType<typeof toProfileModel> | null = null;
  if (session && session.user.role !== "admin") {
    const result = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        degrees: { orderBy: { uploadedAt: "asc" } },
        certificates: true,
        socialLinks: true,
        profileLinks: true,
      },
    });
    if (!result) {
      redirect("/onboarding");
    }
    profile = toProfileModel(result);
  }

  return (
    <AuthProvider session={session}>
      <RequireAuth>
        <AppShell profile={profile}>{children}</AppShell>
      </RequireAuth>
    </AuthProvider>
  );
}
