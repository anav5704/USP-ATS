import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { AdminApplicantsPage } from "@/components/applications/admin-applicants-page";
import { getCachedSession } from "@/lib/auth-session";
import { getQueryClient } from "@/lib/get-query-client";
import { adminApplicantsPageOptions } from "@/lib/applications/application-query-options";
import {
  AdminApplicantsNotFoundError,
  getAdminApplicants,
} from "@/lib/applications/admin-applicants-queries";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";

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
      ...adminApplicantsPageOptions(jobId, 1),
      queryFn: () => getAdminApplicants(jobId, 1, ADMIN_PAGE_SIZE),
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
