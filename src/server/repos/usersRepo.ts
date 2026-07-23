// Port of backend/studio/repositories/users_repo.py — same function surface,
// same returned shapes (camelCase, no `id`). findByEmail/findById return the
// FULL doc incl. passwordHash — only create() strips it (login depends on this).
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { toDoc } from "./doc";

export const VERIFY_TTL_S = 24 * 3600;
export const RESET_TTL_S = 3600;

export class EmailTaken extends Error {}

export type UserDoc = Record<string, unknown> & {
  userId: string;
  email: string;
  name: string | null;
  emailVerified: boolean | null;
};

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

function tokenHash(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function publicDoc<T extends Record<string, unknown> | null>(user: T): T {
  if (!user) return user;
  const clean = { ...user } as Record<string, unknown>;
  delete clean.passwordHash;
  delete clean.passwordSalt;
  return clean as T;
}

export async function create(
  name: string,
  email: string,
  passwordHash: string,
  salt: string,
): Promise<UserDoc> {
  try {
    const row = await prisma().users.create({
      data: {
        userId: `usr-${randomBytes(8).toString("hex")}`,
        email: normalizeEmail(email),
        name: name.trim(),
        passwordHash,
        passwordSalt: salt,
        emailVerified: false,
        createdAt: Date.now() / 1000,
      },
    });
    return publicDoc(toDoc(row)) as UserDoc;
  } catch (exc) {
    if (exc instanceof Prisma.PrismaClientKnownRequestError && exc.code === "P2002") {
      throw new EmailTaken(normalizeEmail(email));
    }
    throw exc;
  }
}

export async function findByEmail(email: string): Promise<UserDoc | null> {
  const row = await prisma().users.findFirst({ where: { email: normalizeEmail(email) } });
  return toDoc(row) as UserDoc | null;
}

export async function findById(userId: string): Promise<UserDoc | null> {
  const row = await prisma().users.findFirst({ where: { userId } });
  return toDoc(row) as UserDoc | null;
}

export async function isEmpty(): Promise<boolean> {
  return (await prisma().users.findFirst()) === null;
}

export async function setVerified(userId: string): Promise<void> {
  await prisma().users.updateMany({ where: { userId }, data: { emailVerified: true } });
}

export async function setPassword(
  userId: string,
  passwordHash: string,
  salt: string,
): Promise<void> {
  await prisma().users.updateMany({
    where: { userId },
    data: { passwordHash, passwordSalt: salt },
  });
}

export async function issueToken(
  userId: string,
  purpose: string,
  ttlS: number,
): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await prisma().auth_tokens.create({
    data: {
      tokenHash: tokenHash(raw),
      userId,
      purpose,
      expiresAt: Date.now() / 1000 + ttlS,
    },
  });
  return raw;
}

export async function consumeToken(
  raw: string | null | undefined,
  purpose: string,
): Promise<string | null> {
  const hashed = tokenHash(raw ?? "");
  const row = await prisma().auth_tokens.findFirst({ where: { tokenHash: hashed, purpose } });
  if (!row) return null;
  await prisma().auth_tokens.deleteMany({ where: { tokenHash: hashed } });
  return row.expiresAt !== null && row.expiresAt >= Date.now() / 1000 ? row.userId : null;
}
