import { AdminJobList } from "@/components/jobs/admin-job-list";
import { requireAdminPage } from "@/lib/jobs/require-admin";

export default async function AdminJobsPage() {
  await requireAdminPage();
  return <AdminJobList />;
}
