import type {
  BuilderChatResponse,
  BuilderProject,
  BuilderProjectContext,
  BuilderTemplate,
  BuilderGenerateResponse,
} from "@/lib/builder-types";
import { getToken, handleUnauthorized } from "@/lib/auth";

export const BASE = (
  process.env.NEXT_PUBLIC_STUDIO_API ?? "http://127.0.0.1:8787"
).trim();

const REQUEST_TIMEOUT_MS = 35000;

async function realFetch<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const token = getToken();
  const mergedInit: RequestInit = {
    ...init,
    headers: {
      ...((init?.headers as Record<string, string>) ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: controller.signal,
  };
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, mergedInit);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`API timeout: ${path}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error(`API 401: ${path} - session expired`);
  }
  if (!res.ok) {
    let detail = "";
    try {
      const payload = await res.json();
      if (typeof payload?.detail === "string") detail = payload.detail;
      else if (payload?.detail) detail = JSON.stringify(payload.detail);
    } catch {
      try {
        detail = await res.text();
      } catch {
        detail = "";
      }
    }
    const suffix = detail ? ` - ${detail}` : "";
    throw new Error(`API ${res.status}: ${path}${suffix}`);
  }
  return res.json() as Promise<T>;
}

export async function listBuilderProjects(): Promise<BuilderProject[]> {
  return realFetch("/builder/projects");
}

export async function createBuilderProject(body: {
  projectName: string;
  initialPrompt?: string;
}): Promise<BuilderProject> {
  return realFetch("/builder/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function sendBuilderChat(
  projectId: string,
  message: string
): Promise<BuilderChatResponse> {
  return realFetch(`/builder/projects/${encodeURIComponent(projectId)}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

export async function requestTemplateGeneration(
  projectId: string,
  force = false
): Promise<BuilderGenerateResponse> {
  const suffix = force ? "?force=true" : "";
  return realFetch(
    `/builder/projects/${encodeURIComponent(projectId)}/generate-templates${suffix}`,
    {
      method: "POST",
    },
    120000
  );
}

export async function listBuilderTemplates(projectId: string): Promise<BuilderTemplate[]> {
  return realFetch(`/builder/projects/${encodeURIComponent(projectId)}/templates`);
}

export async function selectBuilderTemplate(
  projectId: string,
  templateId: string
): Promise<{ html: string; templateId: string }> {
  return realFetch(
    `/builder/projects/${encodeURIComponent(projectId)}/templates/${encodeURIComponent(templateId)}/select`,
    { method: "POST" }
  );
}

export async function getBuilderWorkingHtml(
  projectId: string
): Promise<{ html: string; selectedTemplateId: string | null } | null> {
  try {
    return await realFetch(`/builder/projects/${encodeURIComponent(projectId)}/working-html`);
  } catch {
    return null;
  }
}

export async function editBuilderProject(
  projectId: string,
  prompt: string,
  structural = false
): Promise<{ html: string; changeScope: string }> {
  return realFetch(
    `/builder/projects/${encodeURIComponent(projectId)}/edit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, structural }),
    },
    120000
  );
}

export async function getBuilderProjectContext(
  projectId: string
): Promise<BuilderProjectContext> {
  return realFetch(`/builder/projects/${encodeURIComponent(projectId)}/context`);
}
