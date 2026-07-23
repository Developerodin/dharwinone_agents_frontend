import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, parseBody, rateLimit, authErrorResponse } from "@/server/api";
import * as authService from "@/server/services/authService";

const LoginRequest = z.object({ email: z.string(), password: z.string() });

export async function POST(request: Request) {
  const { body, error } = await parseBody(request, LoginRequest);
  if (error) return error;
  const emailKey = body.email.trim().toLowerCase();
  const limited =
    rateLimit(`login:email:${emailKey}`, 5, 900) ??
    rateLimit(`login:ip:${clientIp(request)}`, 20, 900);
  if (limited) return limited;
  try {
    return NextResponse.json(await authService.login(body.email, body.password));
  } catch (exc) {
    if (exc instanceof authService.AuthError) return authErrorResponse(exc);
    throw exc;
  }
}
