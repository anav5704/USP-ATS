import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth-session";
import { AdminJobList } from "@/components/jobs/admin-job-list";

export default async function HomePage() {
  const session = await getCachedSession();

  if (session?.user.role === "admin") {
    return <AdminJobList />;
  }

  redirect("/jobs");
}
