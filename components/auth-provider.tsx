"use client";

import { SessionContext } from "@/lib/use-auth";
import type { Session } from "@/lib/use-auth";

export function AuthProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
  );
}
