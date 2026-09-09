import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ApprovalList } from "@/components/jobs/approvals/approval-list";

export default async function ApprovalsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/access-denied");
  return <ApprovalList />;
}
