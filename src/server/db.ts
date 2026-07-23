// Prisma client lifecycle (port of backend/studio/db.py). Lazy so tests can
// inject a PGlite-backed client before first use (the memory:// equivalent).
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const g = globalThis as unknown as { __dharwinPrisma?: PrismaClient };

export function prisma(): PrismaClient {
  if (!g.__dharwinPrisma) {
    g.__dharwinPrisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    });
  }
  return g.__dharwinPrisma;
}

export function setPrismaForTests(client: PrismaClient): void {
  g.__dharwinPrisma = client;
}
