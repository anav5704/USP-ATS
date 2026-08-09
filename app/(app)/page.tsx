import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminJobList } from "@/components/jobs/admin-job-list";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role === "admin") {
    return <AdminJobList />;
  }

  return null;
}
