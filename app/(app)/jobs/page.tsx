import { JobFeed } from "@/components/jobs/job-feed";
import { requireMemberPage } from "@/lib/jobs/require-member";

export default async function JobsPage() {
  await requireMemberPage();

  return <JobFeed />;
}
