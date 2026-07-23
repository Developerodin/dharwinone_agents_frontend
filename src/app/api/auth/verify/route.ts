import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, parseBody, rateLimit, authErrorResponse } from "@/server/api";
import * as authService from "@/server/services/authService";

const TokenRequest = z.object({ token: z.string() });

export async function POST(request: Request) {
  const limited = rateLimit(`verify:ip:${clientIp(request)}`, 10, 3600);
  if (limited) return limited;
  const { body, error } = await parseBody(request, TokenRequest);
  if (error) return error;
  try {
    await authService.verifyEmail(body.token);
  } catch (exc) {
    if (exc instanceof authService.AuthError) return authErrorResponse(exc);
    throw exc;
  }
  return NextResponse.json({ status: "verified" });
}
