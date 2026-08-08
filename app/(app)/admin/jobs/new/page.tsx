import { CreateJobModal } from "@/components/jobs/create-job-modal";
import { requireAdminPage } from "@/lib/jobs/require-admin";

export default async function NewJobPage() {
  await requireAdminPage();
  return <CreateJobModal />;
}
