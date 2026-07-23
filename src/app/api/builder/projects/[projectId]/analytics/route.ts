// Port of app.py's GET /builder/projects/{project_id}/analytics (lines 597-601).
// Unlike the other reads in this file, the Python route calls
// `_builder_project_or_404` directly (not a service) before delegating to
// analytics_repo.summarize — mirrored here with builderProjectOr404.
import { NextResponse } from "next/server";
import { builderProjectOr404, httpErrorResponse } from "@/server/api";
import { HttpError } from "@/server/policy";
import * as analyticsRepo from "@/server/repos/analyticsRepo";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    await builderProjectOr404(projectId);
    return NextResponse.json(await analyticsRepo.summarize(projectId));
  } catch (exc) {
    if (exc instanceof HttpError) return httpErrorResponse(exc);
    throw exc;
  }
}
