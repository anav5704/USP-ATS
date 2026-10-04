import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getCachedSession } from "@/lib/auth-session";
import { AdminJobList } from "@/components/jobs/admin-job-list";
import { getQueryClient } from "@/lib/get-query-client";
import { adminJobsPageOptions } from "@/lib/jobs/job-query-options";
import { getAdminJobList } from "@/lib/jobs/job-list-queries";
import { EMPTY_ADMIN_JOB_FILTERS } from "@/lib/jobs/job-filters";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";

export default async function HomePage() {
  const session = await getCachedSession();

  if (session?.user.role === "admin") {
    const queryClient = getQueryClient();

    await queryClient.prefetchQuery({
      ...adminJobsPageOptions(EMPTY_ADMIN_JOB_FILTERS, 1),
      queryFn: () =>
        getAdminJobList(EMPTY_ADMIN_JOB_FILTERS, 1, ADMIN_PAGE_SIZE),
    });

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AdminJobList />
      </HydrationBoundary>
    );
  }

  redirect("/jobs");
}
