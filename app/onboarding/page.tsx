import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/profile/onboarding-form";

export default async function OnboardingPage() {
  const session = await getCachedSession();

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
    <div className="flex min-h-svh flex-1 overflow-y-auto bg-background px-4 py-6">
      <div className="m-auto flex w-full max-w-2xl flex-col items-center">
        <h1 className="text-center text-3xl font-bold text-foreground md:text-4xl">
          Welcome to <span className="text-primary-gradient">USP ATS</span>
        </h1>
        <main className="mt-8 w-full">
          <OnboardingForm user={session.user} />
        </main>
      </div>
    </div>
  );
}
