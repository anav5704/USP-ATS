import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getPoolConfig } from "@/lib/db-connection";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function getPool() {
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new Pool({
      ...getPoolConfig(process.env.DATABASE_URL),
      max: Number(process.env.PG_POOL_MAX ?? 10),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalForPrisma.pgPool;
}

function createPrismaClient() {
  return new PrismaClient({ adapter: new PrismaPg(getPool()) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
