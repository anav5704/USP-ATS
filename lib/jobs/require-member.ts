import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth-session";

export async function requireMemberPage() {
  const session = await getCachedSession();

  if (!session) redirect("/sign-in");
  if (session.user.role !== "member") redirect("/access-denied");

  return session;
}
