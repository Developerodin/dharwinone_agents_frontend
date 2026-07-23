// Port of backend/studio/app.py GET /builder/projects/{project_id}. No auth
// check in the Python handler (it takes no Request param) — read-only lookup.
import { NextResponse } from "next/server";
import * as projectsRepo from "@/server/repos/projectsRepo";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const doc = await projectsRepo.get(projectId);
  if (!doc) return NextResponse.json({ detail: "project not found" }, { status: 404 });
  return NextResponse.json(doc);
}
