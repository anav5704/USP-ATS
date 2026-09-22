import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminApplicantsPage } from "@/components/applications/admin-applicants-page";
import { auth } from "@/lib/auth";

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/access-denied");

  const { jobId } = await params;
  return <AdminApplicantsPage jobId={jobId} />;
}
