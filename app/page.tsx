import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { signOutAction } from "./actions/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Welcome{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        {session?.user?.email && (
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            {session.user.email}
          </p>
        )}
        {session?.user?.role && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Role: {session.user.role}
          </p>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            className="mt-8 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Sign Out
          </button>
        </form>
      </main>
    </div>
  )
}
