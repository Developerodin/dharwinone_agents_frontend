// Port of app.py's POST /builder/projects/{project_id}/assets/confirm
// (lines 616-631). No auth guard — asset_service.confirm_upload 422s on
// AssetValidationError, 404s via ValueError when the project is missing.
import { NextResponse } from "next/server";
import { z } from "zod";
import { httpErrorResponse, parseBody } from "@/server/api";
import { HttpError } from "@/server/policy";
import * as assetService from "@/server/services/assetService";

// Port of app.py's AssetConfirmRequest.
const AssetConfirmRequest = z.object({
  assetId: z.string(),
  s3Key: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { body, error } = await parseBody(request, AssetConfirmRequest);
  if (error) return error;
  try {
    return NextResponse.json(
      await assetService.confirmUpload(projectId, {
        assetId: body.assetId,
        s3Key: body.s3Key,
        contentType: body.contentType,
        sizeBytes: body.sizeBytes,
        width: body.width ?? null,
        height: body.height ?? null,
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
