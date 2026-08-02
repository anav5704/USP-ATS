import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") ?? "/";

  const signInRequest = new Request(
    new URL("/api/auth/sign-in/social", request.nextUrl.origin),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
        origin: request.nextUrl.origin,
      },
      body: JSON.stringify({
        provider: "microsoft",
        callbackURL: callbackUrl,
        disableRedirect: true,
      }),
    }
  );

  const authResponse = await auth.handler(signInRequest);
  const body = await authResponse.json();

  if (!body.url) {
    return NextResponse.json({ error: "Unable to start sign-in" }, { status: 400 });
  }

  const response = NextResponse.redirect(body.url);
  const setCookie = authResponse.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}
