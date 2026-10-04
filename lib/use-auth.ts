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
  return { data: hydrated, isPending: false };
}

export function useLiveSession() {
  return authClient.useSession();
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
