import Link from "next/link";
import { Button } from "@heroui/react";
import { ShieldXIcon } from "lucide-react";
import { SignOutButton } from "@/components/ui/sign-out-button";

export default function AccessDeniedPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-100 p-6">
      <main className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm">
        <ShieldXIcon className="mx-auto size-12 text-rose-500" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Your account does not have permission to access this page.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="inline-block">
            <Button.Root className="rounded-field bg-zinc-900 px-5 text-white">
              Return Home
            </Button.Root>
          </Link>
          <SignOutButton />
        </div>
      </main>
    </div>
  );
}
