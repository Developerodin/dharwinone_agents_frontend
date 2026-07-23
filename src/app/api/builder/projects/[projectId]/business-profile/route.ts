// Port of app.py's GET/PUT /builder/projects/{project_id}/business-profile
// (lines 413-433). No auth guard in the Python — both handlers just delegate
// to profile_service, which 404s via ValueError when the project is missing.
import { NextResponse } from "next/server";
import { z } from "zod";
import { httpErrorResponse, parseBody } from "@/server/api";
import { HttpError } from "@/server/policy";
import * as profileService from "@/server/services/profileService";

// Port of app.py's BusinessProfilePatch — all fields optional/nullable.
const BusinessProfilePatch = z.object({
  brand: z.record(z.string(), z.unknown()).nullable().optional(),
  business: z.record(z.string(), z.unknown()).nullable().optional(),
  location: z.record(z.string(), z.unknown()).nullable().optional(),
  contact: z.record(z.string(), z.unknown()).nullable().optional(),
  design: z.record(z.string(), z.unknown()).nullable().optional(),
  skipped: z.array(z.string()).nullable().optional(),
});

// Port of pydantic's `body.model_dump(exclude_none=True)`.
function excludeNone(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    return NextResponse.json(await profileService.getProfile(projectId));
  } catch (exc) {
    if (exc instanceof HttpError) return httpErrorResponse(exc);
    throw exc;
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { body, error } = await parseBody(request, BusinessProfilePatch);
  if (error) return error;
  try {
    return NextResponse.json(await profileService.updateProfile(projectId, excludeNone(body)));
  } catch (exc) {
    if (exc instanceof profileService.ProfileValidationError) {
      return NextResponse.json({ detail: exc.message }, { status: 422 });
    }
    if (exc instanceof HttpError) return httpErrorResponse(exc);
    throw exc;
  }
}
