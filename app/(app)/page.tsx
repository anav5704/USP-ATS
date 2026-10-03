import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getCachedSession } from "@/lib/auth-session";
import { AdminJobList } from "@/components/jobs/admin-job-list";
import { getQueryClient } from "@/lib/get-query-client";
import { jobQueryKeys } from "@/lib/jobs/query-keys";
import { getAdminJobList } from "@/lib/jobs/job-list-queries";

export default async function HomePage() {
  const session = await getCachedSession();

  if (session?.user.role === "admin") {
    const queryClient = getQueryClient();

    await queryClient.prefetchQuery({
      queryKey: jobQueryKeys.adminLists(),
      queryFn: getAdminJobList,
      staleTime: 30_000,
    });

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AdminJobList />
      </HydrationBoundary>
    );
  }

  redirect("/jobs");
}
