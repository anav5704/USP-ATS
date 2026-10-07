import type { PoolConfig } from "pg";

/**
 * Base pool config for node-postgres with TLS enabled for hosted databases.
 *
 * Hosted Postgres (Render, Neon) terminates TLS at the server and closes
 * plaintext connections, which surfaces in Prisma as P1017 "Server has
 * closed the connection". Local Postgres typically runs without TLS, so
 * SSL is skipped for localhost to keep `pnpm dev` working out of the box.
 */
export function getPoolConfig(
  connectionString: string | undefined,
): PoolConfig {
  const isLocal =
    !connectionString ||
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  if (isLocal) {
    return { connectionString };
  }

  return {
    connectionString,
    ssl: { rejectUnauthorized: false },
  };
}
