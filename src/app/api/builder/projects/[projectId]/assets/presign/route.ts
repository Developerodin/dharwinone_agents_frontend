// Port of app.py's POST /builder/projects/{project_id}/assets/presign
// (lines 602-614). No auth guard — asset_service.create_presign 422s on
// AssetValidationError, 404s via ValueError when the project is missing.
import { NextResponse } from "next/server";
import { z } from "zod";
import { httpErrorResponse, parseBody } from "@/server/api";
import { HttpError } from "@/server/policy";
import * as assetService from "@/server/services/assetService";

// Port of app.py's AssetPresignRequest.
const AssetPresignRequest = z.object({
  filename: z.string(),
  contentType: z.string(),
  assetType: z.string(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { body, error } = await parseBody(request, AssetPresignRequest);
  if (error) return error;
  try {
    return NextResponse.json(
      await assetService.createPresign(projectId, {
        filename: body.filename,
        contentType: body.contentType,
        assetType: body.assetType,
      }),
    );
  } catch (exc) {
    if (exc instanceof assetService.AssetValidationError) {
      return NextResponse.json({ detail: exc.message }, { status: 422 });
    }
    if (exc instanceof HttpError) return httpErrorResponse(exc);
    throw exc;
  }
}
