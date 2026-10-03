import { redirect } from "next/navigation";
import { AdminApplicantsPage } from "@/components/applications/admin-applicants-page";
import { getCachedSession } from "@/lib/auth-session";

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const session = await getCachedSession();
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/access-denied");

  const { jobId } = await params;
  return <AdminApplicantsPage jobId={jobId} />;
}
