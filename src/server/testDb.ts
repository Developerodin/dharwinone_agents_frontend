// Test-only: fresh in-memory Postgres (PGlite) per call, schema from the real
// baseline migration — the port's equivalent of the Python memory:// SQLite path.
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@/generated/prisma/client";
import { setPrismaForTests } from "./db";

const MIGRATION_SQL = path.join(
  process.cwd(),
  "prisma",
  "migrations",
  "0_init",
  "migration.sql",
);

export async function freshTestDb(): Promise<PrismaClient> {
  const pglite = new PGlite();
  await pglite.exec(readFileSync(MIGRATION_SQL, "utf8"));
  const client = new PrismaClient({ adapter: new PrismaPGlite(pglite) });
  setPrismaForTests(client);
  return client;
}
