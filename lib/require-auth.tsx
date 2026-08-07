"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(`/sign-in?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [isPending, session, router, pathname]);

  if (isPending || !session) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-100">
        <p className="text-sm text-zinc-500">Checking session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
