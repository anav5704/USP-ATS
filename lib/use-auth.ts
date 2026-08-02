"use client";

import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

export type Session = NonNullable<
  ReturnType<typeof authClient.useSession>["data"]
>;

export const SessionContext = createContext<Session | null>(null);

export function useSessionContext() {
  return useContext(SessionContext);
}

export function useAuth() {
  const hydrated = useSessionContext();
  const live = authClient.useSession();

  if (hydrated) {
    return { data: hydrated, isPending: false };
  }
  return live;
}

export async function signInWithMicrosoft(
  callbackURL = "/",
  errorCallbackURL?: string
) {
  await authClient.signIn.social({
    provider: "microsoft",
    callbackURL,
    errorCallbackURL,
  });
}
