import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toProfileModel } from "@/lib/profile/to-profile-input";
import { AuthProvider } from "@/components/auth-provider";
import { RequireAuth } from "@/lib/require-auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
        education: true,
        projects: true,
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
