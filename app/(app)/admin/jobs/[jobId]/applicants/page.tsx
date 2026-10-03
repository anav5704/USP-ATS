import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { AdminApplicantsPage } from "@/components/applications/admin-applicants-page";
import { getCachedSession } from "@/lib/auth-session";
import { getQueryClient } from "@/lib/get-query-client";
import { applicationQueryKeys } from "@/lib/applications/query-keys";
import {
  AdminApplicantsNotFoundError,
  getAdminApplicants,
} from "@/lib/applications/admin-applicants-queries";

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const session = await getCachedSession();
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/access-denied");

  const { jobId } = await params;
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: applicationQueryKeys.adminJob(jobId),
      queryFn: () => getAdminApplicants(jobId),
      staleTime: 30_000,
    });
  } catch (error) {
    if (!(error instanceof AdminApplicantsNotFoundError)) throw error;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminApplicantsPage jobId={jobId} />
    </HydrationBoundary>
  );
}
