// Port of app.py's GET /builder/projects/{project_id}/context (lines 551-557).
// No auth guard — context_service.get_context 404s via ValueError when the
// project is missing.
import { NextResponse } from "next/server";
import { httpErrorResponse } from "@/server/api";
import { HttpError } from "@/server/policy";
import * as contextService from "@/server/services/contextService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    return NextResponse.json(await contextService.getContext(projectId));
  } catch (exc) {
    if (exc instanceof HttpError) return httpErrorResponse(exc);
    throw exc;
  }
}
