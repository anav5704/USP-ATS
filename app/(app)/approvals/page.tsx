import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth-session";
import { ApprovalList } from "@/components/jobs/approvals/approval-list";

export default async function ApprovalsPage() {
  const session = await getCachedSession();
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/access-denied");
  return <ApprovalList />;
}
