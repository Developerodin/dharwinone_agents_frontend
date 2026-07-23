// Port of backend/studio/services/version_service.py — version restore and lineage.
import { HttpError } from "../policy";
import * as editsRepo from "../repos/editsRepo";
import * as projectsRepo from "../repos/projectsRepo";
import * as versionsRepo from "../repos/versionsRepo";
import * as workingHtmlRepo from "../repos/workingHtmlRepo";

export class VersionError extends Error {}

export async function restore(projectId: string, versionId: string): Promise<Record<string, unknown>> {
  if (!(await projectsRepo.get(projectId))) {
    throw new HttpError(404, "project not found");
  }
  const version = await versionsRepo.get(projectId, versionId);
  if (!version) throw new VersionError("version not found");
  const html = version.snapshotHtml as string | null;
  if (!html) throw new VersionError("version snapshot missing");

  await workingHtmlRepo.put(projectId, html, { templateId: null });
  const restored = await versionsRepo.create(projectId, {
    label: `Restored from ${versionId}`,
    trigger: "restore",
    html,
  });
  await projectsRepo.updateFields(projectId, {
    currentVersionId: restored.versionId,
    status: "editing",
  });
  await editsRepo.append(projectId, {
    source: "restore",
    userPrompt: "",
    actionSummary: `Restored version ${versionId}`,
    changeScope: "restore",
    targets: [versionId],
    versionId: restored.versionId as string,
  });
  return {
    restoredFrom: versionId,
    versionId: restored.versionId,
    html,
  };
}

export async function listVersions(projectId: string): Promise<versionsRepo.VersionDoc[]> {
  if (!(await projectsRepo.get(projectId))) {
    throw new HttpError(404, "project not found");
  }
  return versionsRepo.listForProject(projectId);
}
