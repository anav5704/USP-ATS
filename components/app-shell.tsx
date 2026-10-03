import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary-gradient flex h-svh overflow-hidden">
      <AppSidebar />
      <main className="m-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#111111]">
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}