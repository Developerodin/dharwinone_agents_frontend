// Port of app.py's GET /builder/projects/{project_id}/assets (lines 633-638).
// No auth guard — asset_service.list_assets 404s via ValueError when the
// project is missing.
import { NextResponse } from "next/server";
import { httpErrorResponse } from "@/server/api";
import { HttpError } from "@/server/policy";
import * as assetService from "@/server/services/assetService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    return NextResponse.json(await assetService.listAssets(projectId));
  } catch (exc) {
    if (exc instanceof HttpError) return httpErrorResponse(exc);
    throw exc;
  }
}
