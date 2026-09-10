import { MyApplications } from "@/components/applications/my-applications";
import { requireMemberPage } from "@/lib/jobs/require-member";

export default async function ApplicationsPage() {
  await requireMemberPage();

  return <MyApplications />;
}