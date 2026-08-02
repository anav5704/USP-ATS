import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AuthProvider } from "@/components/auth-provider";
import { RequireAuth } from "@/lib/require-auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <AuthProvider session={session}>
      <RequireAuth>
        <AppShell>{children}</AppShell>
      </RequireAuth>
    </AuthProvider>
  );
}
