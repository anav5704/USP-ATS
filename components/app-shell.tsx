"use client";

import type { ProfileModel } from "@/lib/profile/to-profile-input";
import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({
  profile,
  children,
}: {
  profile: ProfileModel | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh bg-zinc-100">
      <AppSidebar profile={profile} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
