import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, rateLimit, requestBaseUrl } from "@/server/api";
import * as authService from "@/server/services/authService";

const EmailRequest = z.object({ email: z.string() });

export async function POST(request: Request) {
  const { body, error } = await parseBody(request, EmailRequest);
  if (error) return error;
  const limited = rateLimit(`resend:email:${body.email.trim().toLowerCase()}`, 3, 3600);
  if (limited) return limited;
  await authService.resendVerification(body.email, requestBaseUrl(request));
  return NextResponse.json({ status: "ok" });
}
