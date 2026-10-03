"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";
import { signInWithMicrosoft, useLiveSession } from "@/lib/use-auth";

function SignInForm() {
  const { data: session, isPending } = useLiveSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/";
  const error = searchParams.get("error") ?? null;
  const started = useRef(false);

  useEffect(() => {
    if (isPending) return;
    if (session) {
      router.replace(returnTo);
      return;
    }
    if (error || started.current) return;
    started.current = true;
    const errorCallbackURL = `/sign-in?returnTo=${encodeURIComponent(returnTo)}&error=1`;
    signInWithMicrosoft(returnTo, errorCallbackURL);
  }, [isPending, session, router, returnTo, error]);

  if (isPending) {
    return (
      <div className="bg-primary-gradient flex flex-1 items-center justify-center">
        <Spinner.Root size="lg" className="text-foreground" />
      </div>
    );
  }

  if (session) {
    return (
      <div className="bg-primary-gradient flex flex-1 items-center justify-center">
        <Spinner.Root size="lg" className="text-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary-gradient flex flex-1 items-center justify-center p-6">
        <main className="w-full max-w-sm rounded-2xl bg-surface p-8 text-center shadow-overlay">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in failed
          </h1>
          <p className="mt-2 text-sm text-muted">
            We couldn&apos;t complete the sign-in with your Microsoft account. Please try again.
          </p>
          <button
            type="button"
            onClick={() => signInWithMicrosoft(returnTo)}
            className="mt-6 w-full rounded-field bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Try Again
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-primary-gradient flex flex-1 items-center justify-center">
      <Spinner.Root size="lg" className="text-foreground" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-primary-gradient flex flex-1 items-center justify-center">
          <Spinner.Root size="lg" className="text-foreground" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}