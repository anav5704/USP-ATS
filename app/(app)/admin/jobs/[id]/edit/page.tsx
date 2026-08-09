import { EditJobModal } from "@/components/jobs/edit-job-modal";
import { requireAdminPage } from "@/lib/jobs/require-admin";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;

  return <EditJobModal jobId={id} />;
}
