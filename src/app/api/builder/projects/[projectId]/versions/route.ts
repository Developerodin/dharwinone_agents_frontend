// Port of app.py's GET /builder/projects/{project_id}/versions (lines 529-535).
// No auth guard — version_service.list_versions 404s via ValueError when the
// project is missing.
import { NextResponse } from "next/server";
import { httpErrorResponse } from "@/server/api";
import { HttpError } from "@/server/policy";
import * as versionService from "@/server/services/versionService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    return NextResponse.json(await versionService.listVersions(projectId));
  } catch (exc) {
    if (exc instanceof HttpError) return httpErrorResponse(exc);
    throw exc;
  }
}
