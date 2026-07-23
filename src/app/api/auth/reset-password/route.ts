import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, parseBody, rateLimit, authErrorResponse } from "@/server/api";
import * as authService from "@/server/services/authService";

const ResetPasswordRequest = z.object({ token: z.string(), password: z.string() });

export async function POST(request: Request) {
  const limited = rateLimit(`reset:ip:${clientIp(request)}`, 10, 3600);
  if (limited) return limited;
  const { body, error } = await parseBody(request, ResetPasswordRequest);
  if (error) return error;
  try {
    await authService.resetPassword(body.token, body.password);
  } catch (exc) {
    if (exc instanceof authService.AuthError) return authErrorResponse(exc);
    throw exc;
  }
  return NextResponse.json({ status: "ok" });
}
