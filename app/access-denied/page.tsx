import Link from "next/link";
import { Button } from "@heroui/react";
import { ShieldXIcon } from "lucide-react";
import { SignOutButton } from "@/components/ui/sign-out-button";

export default function AccessDeniedPage() {
  return (
    <div className="bg-primary-gradient flex flex-1 items-center justify-center p-3 sm:p-6">
      <main className="w-full max-w-sm rounded-2xl bg-surface p-5 text-center shadow-overlay sm:p-8">
        <ShieldXIcon className="mx-auto size-12 text-danger" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your account does not have permission to access this page.
        </p>
        <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href="/" className="inline-block">
            <Button.Root className="rounded-field bg-foreground px-5 text-background">
              Return Home
            </Button.Root>
          </Link>
          <SignOutButton />
        </div>
      </main>
    </div>
  );
}
