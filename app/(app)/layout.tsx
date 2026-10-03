import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
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

  // Gate only: existence check for the onboarding redirect. Full profile
  // is lazy-loaded client-side (ProfileModal via useProfile) so navigation
  // never blocks on degrees/certificates/links joins.
  if (session && session.user.role !== "admin") {
    const existing = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!existing) {
      redirect("/onboarding");
    }
  }

  return (
    <AuthProvider session={session}>
      <RequireAuth>
        <AppShell>{children}</AppShell>
      </RequireAuth>
    </AuthProvider>
  );
}
