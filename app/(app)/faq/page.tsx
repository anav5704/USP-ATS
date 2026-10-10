import { redirect } from "next/navigation";
import { FaqPage } from "@/components/faq/faq-page";
import { getCachedSession } from "@/lib/auth-session";

export default async function FrequentlyAskedQuestionsPage() {
  const session = await getCachedSession();
  if (!session) {
    redirect("/sign-in");
  }

  const role = session.user.role;

  if (role !== "admin" && role !== "member") {
    redirect("/access-denied");
  }

  return <FaqPage role={role} />;
}
