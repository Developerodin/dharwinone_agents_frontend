// Port of backend/studio/policy.py — role policy checks for builder mutations.
// HttpError replaces FastAPI's HTTPException; route handlers convert it via
// httpErrorResponse() in server/api.ts.
export class HttpError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : JSON.stringify(detail));
    this.status = status;
    this.detail = detail;
  }
}

const ROLE_MATRIX: Record<string, Set<string>> = {
  owner: new Set(["read", "edit", "generate", "restore", "share", "publish"]),
  editor: new Set(["read", "edit", "generate", "restore"]),
  viewer: new Set(["read"]),
};

type ProjectLike = Record<string, unknown>;

export function effectiveRole(project: ProjectLike, userId: string): string {
  const owner = (project.ownerUserId as string) || "local-user";
  if (userId === owner) return "owner";
  for (const collab of (project.collaborators as Array<Record<string, unknown>> | null) ?? []) {
    if (collab?.userId === userId) return (collab.role as string) ?? "viewer";
  }
  if (project.visibility === "org") return "editor";
  return userId !== owner ? "viewer" : "owner";
}

export function requireAction(project: ProjectLike, userId: string, action: string): string {
  const role = effectiveRole(project, userId);
  const allowed = ROLE_MATRIX[role] ?? new Set<string>();
  if (!allowed.has(action)) {
    throw new HttpError(403, { code: "forbidden", action, role });
  }
  return role;
}
