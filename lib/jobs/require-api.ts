import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCachedSession } from "@/lib/auth-session";

export type ApiSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type ApiGuard =
  | { ok: true; session: ApiSession }
  | { ok: false; response: NextResponse };

async function requireApiRole(role: "admin" | "member"): Promise<ApiGuard> {
  const session = await getCachedSession();

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You must be signed in" },
        { status: 401 }
      ),
    };
  }
  if (session.user.role !== role) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            role === "admin" ? "Admin access is required" : "Member access is required",
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, session };
}

export function requireApiAdmin() {
  return requireApiRole("admin");
}

export function requireApiMember() {
  return requireApiRole("member");
}