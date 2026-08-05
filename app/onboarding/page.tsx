import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileWizard } from "@/components/profile/profile-wizard";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }
  if (session.user.role === "admin") {
    redirect("/");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (profile) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <main className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            USP-ATS
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create your profile
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            You need a complete profile before you can browse and apply to job
            postings. You can update it any time.
          </p>
        </div>
        <ProfileWizard
          mode="create"
          variant="page"
          accountInfo={{
            name: session.user.name?.trim() || "User",
            email: session.user.email ?? "",
          }}
        />
      </main>
    </div>
  );
}
