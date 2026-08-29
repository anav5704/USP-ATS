"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { LogOutIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <Button.Root
      onPress={() => void handleSignOut()}
      variant="ghost"
      className="rounded-field border border-border px-5 text-sm font-medium text-foreground hover:bg-surface-secondary"
    >
      <LogOutIcon className="size-4" />
      Sign Out
    </Button.Root>
  );
}
