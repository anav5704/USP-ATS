import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/profile/onboarding-form";

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
  if (session.user.role !== "member") {
    redirect("/access-denied");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (profile) {
    redirect("/");
  }

  return (
    <div className="bg-primary-gradient flex min-h-svh flex-1 overflow-y-auto px-4 py-6">
      <div className="m-auto flex w-full max-w-2xl flex-col items-center">
        <h1 className="text-center text-3xl font-bold text-foreground md:text-4xl">
          Welcome to <span className="text-white">USP ATS</span>
        </h1>
        <main className="mt-8 w-full">
          <OnboardingForm user={session.user} />
        </main>
      </div>
    </div>
  );
}
