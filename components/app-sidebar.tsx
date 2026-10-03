"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BellIcon,
  BookmarkIcon,
  BriefcaseIcon,
  ClipboardListIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  HelpCircleIcon,
  LogOutIcon,
  UserRoundIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/use-auth";
import { ProfileModal } from "@/components/profile/profile-modal";

type LucideIcon = React.ComponentType<{ className?: string }>;

type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  isActive?: (pathname: string) => boolean;
};

const studentNav: NavItem[] = [
  {
    key: "jobs",
    href: "/jobs",
    label: "Job Feed",
    icon: BriefcaseIcon,
    isActive: (p) => p === "/jobs" || p.startsWith("/jobs/"),
  },
  {
    key: "applications",
    href: "/applications",
    label: "My Applications",
    icon: ClipboardListIcon,
    isActive: (p) => p.startsWith("/applications"),
  },
  {
    key: "saved",
    label: "Saved Jobs",
    icon: BookmarkIcon,
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: BellIcon,
  },
];

const adminNav: NavItem[] = [
  {
    key: "postings",
    href: "/",
    label: "Job Postings",
    icon: BriefcaseIcon,
    isActive: (p) => p === "/" || p.startsWith("/admin/jobs/"),
  },
  {
    key: "approvals",
    href: "/approvals",
    label: "Approvals",
    icon: ClipboardCheckIcon,
    isActive: (p) => p === "/approvals",
  },
  {
    key: "reports",
    label: "Reports",
    icon: FileTextIcon,
  },
];

export function AppSidebar() {
  const { data: session } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const user = session?.user;
  const role = user?.role;
  const nav = role === "admin" ? adminNav : studentNav;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const renderItem = ({ href, onClick, label, icon: Icon, isActive }: NavItem) => {
    const active = isActive?.(pathname) ?? false;
    const itemClass = `group relative flex w-full cursor-pointer items-center justify-center gap-3 py-2 text-sm font-medium text-white transition-opacity lg:justify-start lg:pl-5 lg:pr-3 ${
      active ? "opacity-100" : "opacity-60 hover:opacity-100"
    }`;

    const content = (
      <>
        <span
          className={`absolute -left-1 hidden h-6 w-2 rounded-full bg-white transition-transform lg:block ${
            active ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
          }`}
        />
        <Icon className="size-5 shrink-0" />
        <span className="hidden lg:block">{label}</span>
      </>
    );

    if (href) {
      return (
        <Link
          key={href}
          href={href}
          title={label}
          aria-current={active ? "page" : undefined}
          className={itemClass}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={`btn-${label}`}
        type="button"
        title={label}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={itemClass}
      >
        {content}
      </button>
    );
  };

  return (
    <aside className="flex h-full w-16 shrink-0 flex-col items-center lg:w-56 2xl:w-64">
      <Image
        src="/usp-logo.svg"
        alt="USP Logo"
        width={110}
        height={110}
        className="mb-7 mt-7 h-8 w-8 md:h-8 md:w-8 lg:h-12 lg:w-12 2xl:h-16 2xl:w-16"
      />
      <nav className="flex w-full flex-1 flex-col items-center gap-1 px-2 lg:items-stretch lg:px-0">
        {nav.map((item) => renderItem(item))}
      </nav>
      <div className="mb-3 flex w-full flex-col items-center gap-1 px-2 lg:items-stretch lg:px-0">
        {renderItem({
          key: "help",
          label: "Help & Support",
          icon: HelpCircleIcon,
        })}
        {renderItem({
          key: "profile",
          label: "Profile",
          icon: UserRoundIcon,
          onClick: () => setProfileOpen(true),
        })}
        {renderItem({
          key: "signout",
          label: "Sign Out",
          icon: LogOutIcon,
          onClick: () => void handleSignOut(),
        })}
      </div>
      <ProfileModal
        user={user ?? {}}
        isOpen={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </aside>
  );
}
