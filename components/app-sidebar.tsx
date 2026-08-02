"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Button, Separator } from "@heroui/react";
import {
  BriefcaseIcon,
  ClipboardListIcon,
  LogOutIcon,
  PlusCircleIcon,
  UserRoundIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/use-auth";

type LucideIcon = React.ComponentType<{ className?: string }>;

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

const studentNav: NavItem[] = [
  {
    href: "/",
    label: "Job Feed",
    icon: BriefcaseIcon,
    isActive: (p) => p === "/" || p.startsWith("/jobs"),
  },
  {
    href: "/applications",
    label: "My Applications",
    icon: ClipboardListIcon,
    isActive: (p) => p.startsWith("/applications"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserRoundIcon,
    isActive: (p) => p.startsWith("/profile"),
  },
];

const adminNav: NavItem[] = [
  {
    href: "/",
    label: "Job Postings",
    icon: BriefcaseIcon,
    isActive: (p) => p === "/" || (p.startsWith("/admin/jobs") && p !== "/admin/jobs/new"),
  },
  {
    href: "/admin/jobs/new",
    label: "Post New Job",
    icon: PlusCircleIcon,
    isActive: (p) => p === "/admin/jobs/new",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

export function AppSidebar() {
  const { data: session } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const user = session?.user;
  const role = user?.role;
  const nav = role === "admin" ? adminNav : studentNav;

  return (
    <aside className="sticky top-0 flex h-svh w-72 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-16 items-center px-6">
        <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          USP-ATS
        </span>
      </div>
      <Separator.Root className="bg-zinc-200 dark:bg-zinc-800" />
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {nav.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <Separator.Root className="bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex items-center gap-3 px-4 py-4">
        <Avatar.Root size="sm">
          {user?.image ? (
            <Avatar.Image src={user.image} alt={user.name ?? "User"} />
          ) : (
            <Avatar.Fallback>
              {getInitials(user?.name ?? "?")}
            </Avatar.Fallback>
          )}
        </Avatar.Root>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {user?.name ?? "User"}
          </p>
          <p className="truncate text-xs capitalize text-zinc-500 dark:text-zinc-400">
            {role ?? "No role"}
          </p>
        </div>
        <Button.Root
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Sign out"
          className="text-zinc-500 dark:text-zinc-400"
          onPress={async () => {
            await authClient.signOut();
            router.push("/sign-in");
          }}
        >
          <LogOutIcon className="size-4" />
        </Button.Root>
      </div>
    </aside>
  );
}
