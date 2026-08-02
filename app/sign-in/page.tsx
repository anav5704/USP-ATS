"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";
import { signInWithMicrosoft, useAuth } from "@/lib/use-auth";

function SignInForm() {
  const { data: session, isPending } = useAuth();
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
      <div className="flex flex-1 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <Spinner.Root size="lg" className="text-white" />
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <Spinner.Root size="lg" className="text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <main className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-zinc-900">
          <h1 className="text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Sign in failed
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            We couldn&apos;t complete the sign-in with your Microsoft account. Please try again.
          </p>
          <button
            type="button"
            onClick={() => signInWithMicrosoft(returnTo)}
            className="mt-6 w-full rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Try again
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
      <Spinner.Root size="lg" className="text-white" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
          <Spinner.Root size="lg" className="text-white" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
