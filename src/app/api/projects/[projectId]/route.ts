// Port of backend/studio/app.py GET /projects/{project_id} (legacy file-based store).
import { NextResponse } from "next/server";
import * as legacyProjects from "@/server/legacyProjects";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const project = legacyProjects.get(projectId);
  if (!project) return NextResponse.json({ detail: "project not found" }, { status: 404 });
  return NextResponse.json(project);
}
