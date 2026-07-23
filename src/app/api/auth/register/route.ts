import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, parseBody, rateLimit, requestBaseUrl, authErrorResponse } from "@/server/api";
import * as authService from "@/server/services/authService";

const RegisterRequest = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
});

export async function POST(request: Request) {
  const limited = rateLimit(`register:ip:${clientIp(request)}`, 10, 3600);
  if (limited) return limited;
  const { body, error } = await parseBody(request, RegisterRequest);
  if (error) return error;
  try {
    const user = await authService.register(
      body.name,
      body.email,
      body.password,
      requestBaseUrl(request),
    );
    return NextResponse.json(user, { status: 201 });
  } catch (exc) {
    if (exc instanceof authService.AuthError) return authErrorResponse(exc);
    throw exc;
  }
}
