// Port of backend/studio/security.py password half. Hash format is frozen:
// PBKDF2-SHA256, 600k iterations, utf-8 password+salt, hex salt, base64 digest —
// existing DB hashes must keep verifying (see security.test.ts vectors).
import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);
const ITERATIONS = 600_000;
const KEY_LEN = 32;

export async function hashPassword(
  password: string,
  salt?: string,
): Promise<{ hash: string; salt: string }> {
  const s = salt ?? randomBytes(16).toString("hex");
  const digest = await pbkdf2Async(password, s, ITERATIONS, KEY_LEN, "sha256");
  return { hash: digest.toString("base64"), salt: s };
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
  salt: string,
): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  const a = Buffer.from(hash, "base64");
  const b = Buffer.from(passwordHash, "base64");
  return a.length === b.length && timingSafeEqual(a, b);
}
