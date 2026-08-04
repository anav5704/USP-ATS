import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Avatar } from "@heroui/react";
import { UserRoundIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { ProfileForm } from "@/components/profile/profile-form";

function splitName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0] ?? "",
    last: parts.slice(1).join(" ") ?? "",
  };
}

function toInitialData(
  profile: NonNullable<Awaited<ReturnType<typeof getProfile>>>
): ProfileInput {
  return {
    gpa: Number(profile.gpa),
    skills: profile.skills ?? "",
    degrees: profile.degrees.map((degree) => ({
      name: degree.name,
      institution: degree.institution ?? "",
    })),
    education: profile.education.map((entry) => ({
      institution: entry.institution,
      program: entry.program ?? "",
    })),
    projects: profile.projects.map((project) => ({
      name: project.name,
      description: project.description ?? "",
      link: project.link ?? "",
    })),
  };
}

async function getProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    include: {
      degrees: true,
      education: true,
      projects: true,
    },
  });
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }
  if (session.user.role === "admin") {
    redirect("/");
  }

  const profile = await getProfile(session.user.id);
  if (!profile) {
    redirect("/onboarding");
  }

  const { first, last } = session.user.firstName
    ? {
        first: session.user.firstName,
        last: session.user.lastName ?? "",
      }
    : splitName(session.user.name);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
          <UserRoundIcon className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            My Profile
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            View and update your profile information.
          </p>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <Avatar.Root size="lg">
            {session.user.image ? (
              <Avatar.Image src={session.user.image} alt={session.user.name ?? "User"} />
            ) : (
              <Avatar.Fallback>{session.user.name?.slice(0, 1) ?? "?"}</Avatar.Fallback>
            )}
          </Avatar.Root>
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {first} {last}
            </p>
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {session.user.email}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">First name</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{first}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Last name</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{last}</p>
          </div>
        </div>
      </section>

      <ProfileForm mode="update" initialData={toInitialData(profile)} />
    </div>
  );
}
