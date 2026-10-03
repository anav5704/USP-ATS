import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Dedupes session lookups within a single RSC/API request. Without this,
// layout + page + guards each trigger their own getSession (DB or verify).
// proxy.ts runs in a separate runtime and still does its own coarse check.
// Kept separate from lib/auth.ts so proxy/middleware never pulls in
// next/headers or react cache.
export const getCachedSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});
