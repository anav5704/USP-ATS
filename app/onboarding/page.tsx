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
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
      <main className="w-full max-w-2xl">
        <OnboardingForm user={session.user} />
      </main>
    </div>
  );
}
