// Port of backend/studio/security.py JWT half. Claims contract is frozen
// (iss=dharwin-auth, aud=dharwin-api, HS256, 30s leeway, 24h TTL) so tokens
// issued by the FastAPI backend before cutover keep validating.
// jose only — no node builtins — so this module is safe in proxy.ts (edge or node).
import { SignJWT, jwtVerify } from "jose";

const ISSUER = "dharwin-auth";
const AUDIENCE = "dharwin-api";
const LEEWAY_S = 30;
export const TOKEN_TTL_S = 24 * 3600;

export class TokenError extends Error {}

function secret(): Uint8Array {
  const value = (process.env.AUTH_JWT_SECRET ?? "").trim();
  if (!value) throw new Error("AUTH_JWT_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function issueJwt(userId: string, nowS?: number): Promise<string> {
  const issued = Math.floor(nowS ?? Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt(issued)
    .setExpirationTime(issued + TOKEN_TTL_S)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .sign(secret());
}

export async function verifyJwt(token: string): Promise<string> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
      clockTolerance: LEEWAY_S,
      requiredClaims: ["sub", "exp", "iss", "aud"],
    });
    return payload.sub as string;
  } catch (exc) {
    throw new TokenError(exc instanceof Error ? exc.message : String(exc));
  }
}
