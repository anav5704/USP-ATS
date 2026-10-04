"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionContext } from "@/lib/use-auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = useSessionContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!session) {
      router.replace(`/sign-in?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [session, router, pathname]);

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
