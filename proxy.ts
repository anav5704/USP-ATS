import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const signInUrl = new URL("/sign-in", request.nextUrl.origin);
    signInUrl.searchParams.set(
      "returnTo",
      request.nextUrl.pathname + request.nextUrl.search
    );
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|sign-in|_next/static|_next/image|favicon.ico).*)"],
};
