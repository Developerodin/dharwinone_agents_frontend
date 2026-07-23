// Port of backend/studio/services/auth_service.py — registration, verification,
// login, and first-user legacy adoption. Same statuses, same response shapes.
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { issueJwt } from "../jwt";
import { hashPassword, verifyPassword } from "../password";
import * as usersRepo from "../repos/usersRepo";
import * as emailService from "./emailService";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const GENERIC_LOGIN_ERROR = "invalid email or password";

export class AuthError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(String(detail));
    this.status = status;
    this.detail = detail;
  }
}

function validateRegistration(name: string, email: string, password: string): void {
  if (!(name ?? "").trim()) throw new AuthError(422, "name is required");
  if (!EMAIL_RE.test((email ?? "").trim())) throw new AuthError(422, "invalid email address");
  if ((password ?? "").length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AuthError(422, "password must be at least 8 characters with a letter and a number");
  }
}

export async function register(
  name: string,
  email: string,
  password: string,
  baseUrl?: string | null,
): Promise<usersRepo.UserDoc> {
  validateRegistration(name, email, password);
  if (await usersRepo.findByEmail(email)) {
    throw new AuthError(409, "an account with this email already exists");
  }
  const adopt = await usersRepo.isEmpty();
  const { hash, salt } = await hashPassword(password);
  let user: usersRepo.UserDoc;
  try {
    user = await usersRepo.create(name, email, hash, salt);
  } catch (exc) {
    if (exc instanceof usersRepo.EmailTaken) {
      // Unique-index race: a concurrent registration won between the
      // pre-check above and this insert.
      throw new AuthError(409, "an account with this email already exists");
    }
    throw exc;
  }
  if (adopt) await adoptLegacyData(user.userId);
  const raw = await usersRepo.issueToken(user.userId, "verify", usersRepo.VERIFY_TTL_S);
  await emailService.sendVerification(user.email, raw, baseUrl);
  return user;
}

export async function verifyEmail(rawToken: string): Promise<void> {
  const userId = await usersRepo.consumeToken(rawToken, "verify");
  if (!userId) throw new AuthError(400, "invalid or expired verification token");
  await usersRepo.setVerified(userId);
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: { id: string; email: string; name: string | null } }> {
  const user = await usersRepo.findByEmail(email);
  if (
    !user ||
    !(await verifyPassword(password, String(user.passwordHash ?? ""), String(user.passwordSalt ?? "")))
  ) {
    throw new AuthError(401, GENERIC_LOGIN_ERROR);
  }
  if (!user.emailVerified) {
    throw new AuthError(403, {
      code: "unverified",
      message: "verify your email before signing in",
    });
  }
  return {
    token: await issueJwt(user.userId),
    user: { id: user.userId, email: user.email, name: user.name },
  };
}

export async function resendVerification(email: string, baseUrl?: string | null): Promise<void> {
  const user = await usersRepo.findByEmail(email);
  if (!user || user.emailVerified) return;
  const raw = await usersRepo.issueToken(user.userId, "verify", usersRepo.VERIFY_TTL_S);
  await emailService.sendVerification(user.email, raw, baseUrl);
}

export async function forgotPassword(email: string, baseUrl?: string | null): Promise<void> {
  const user = await usersRepo.findByEmail(email);
  if (!user) return;
  const raw = await usersRepo.issueToken(user.userId, "reset", usersRepo.RESET_TTL_S);
  await emailService.sendPasswordReset(user.email, raw, baseUrl);
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  if (
    (newPassword ?? "").length < 8 ||
    !/[A-Za-z]/.test(newPassword) ||
    !/\d/.test(newPassword)
  ) {
    throw new AuthError(422, "password must be at least 8 characters with a letter and a number");
  }
  const userId = await usersRepo.consumeToken(rawToken, "reset");
  if (!userId) throw new AuthError(400, "invalid or expired reset token");
  const { hash, salt } = await hashPassword(newPassword);
  await usersRepo.setPassword(userId, hash, salt);
}

async function adoptLegacyData(userId: string): Promise<void> {
  // First registered account claims everything owned by 'local-user'.
  try {
    await prisma().meta.create({
      data: { key: "legacy_adoption", value: { userId, at: Date.now() / 1000 } },
    });
  } catch (exc) {
    if (exc instanceof Prisma.PrismaClientKnownRequestError && exc.code === "P2002") {
      return; // another registration already holds the lock
    }
    console.log(`[auth] legacy adoption lock failed unexpectedly: ${exc}`);
    return;
  }
  try {
    await rewriteLegacyOwnership(userId);
  } catch (exc) {
    console.log(`[auth] legacy adoption rewrite failed (re-runnable): ${exc}`);
  }
}

async function rewriteLegacyOwnership(userId: string): Promise<void> {
  // Idempotent: only touches rows still owned by 'local-user' —
  // builder_projects.ownerUserId is the only ownership field in any store.
  await prisma().builder_projects.updateMany({
    where: { ownerUserId: "local-user" },
    data: { ownerUserId: userId },
  });
}
