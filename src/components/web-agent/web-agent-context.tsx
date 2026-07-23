"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { WebAgentPageView } from "@/lib/constants";
import { ROUTES } from "@/lib/constants";
import {
  SAMPLE_CSS,
  SAMPLE_HTML,
  SAMPLE_JS,
  type DeploymentRecord,
  type WebProject,
  type WebsiteVersion,
} from "@/lib/web-agent-data";
import { isUnauthorizedError, isNotFoundError, deleteBuilderProject, listBuilderProjects } from "@/lib/builder-api";
import type { BuilderProject } from "@/lib/builder-types";
import { deleteSite, listSites } from "@/lib/sites-api";
import type { SiteDoc } from "@/lib/sites-types";
import { getToken } from "@/lib/auth";

type WebAgentContextValue = {
  projects: WebProject[];
  deployments: DeploymentRecord[];
  activeProject: WebProject | null;
  activeProjectId: string | null;
  pageView: WebAgentPageView;
  splitView: boolean;
  setSplitView: (v: boolean) => void;
  startNewProject: () => void;
  showMyProjects: () => void;
  showDeployProjects: () => void;
  openProject: (id: string) => void;
  syncFromUrl: (projectId: string | null, view: string | null) => void;
  addProject: (project: WebProject) => void;
  updateProject: (project: WebProject) => void;
  deleteProject: (id: string) => Promise<void>;
  addDeployment: (project: WebProject, version: WebsiteVersion) => void;
  myProjects: WebProject[];
  deployedProjects: WebProject[];
};

const WebAgentContext = createContext<WebAgentContextValue | null>(null);
const STORAGE_KEY = "dharwin:web-agent:state:v1";
let _cachedPersistedState:
  | {
      projects?: WebProject[];
      deployments?: DeploymentRecord[];
      activeProjectId?: string | null;
      pageView?: WebAgentPageView;
      splitView?: boolean;
    }
  | null
  | undefined;

function secondsToIso(ts: number | null | undefined) {
  if (!ts) return new Date().toISOString();
  return new Date(ts * 1000).toISOString();
}

function mapBuilderProject(project: BuilderProject): WebProject {
  const hasVersion = Boolean(project.currentVersionId);
  const prompt = project.initialPrompt ?? "";
  const status =
    project.status === "onboarding"
      ? "draft"
      : hasVersion || project.status === "editing"
        ? "generated"
        : "draft";

  return {
    id: project.projectId,
    name: project.projectName,
    description: prompt ? prompt.slice(0, 120) : "Website project",
    kind: "builder" as const,
    status,
    prompt,
    createdAt: secondsToIso(project.createdAt),
    updatedAt: secondsToIso(project.updatedAt),
    versions: [],
    chatHistory: [],
    uploadedAssets: [],
  };
}

function mapSiteDoc(site: SiteDoc): WebProject {
  const bp = site.businessProfileJson ?? {};
  const name =
    (typeof bp.business_name === "string" && bp.business_name.trim()) ||
    (typeof bp.brandName === "string" && bp.brandName.trim()) ||
    site.subdomain ||
    site.siteId;
  const content = site.contentJson ?? {};
  const hasContent = typeof content === "object" && Object.keys(content).length > 0;
  const prompt =
    (typeof bp.description === "string" && bp.description.trim()) ||
    (typeof bp.initial_prompt === "string" && bp.initial_prompt.trim()) ||
    String(name);

  return {
    id: site.siteId,
    siteId: site.siteId,
    kind: "site",
    name: String(name),
    description: prompt.slice(0, 120),
    status:
      site.status === "published" ? "deployed" : hasContent ? "generated" : "draft",
    prompt,
    createdAt: secondsToIso(site.createdAt),
    updatedAt: secondsToIso(site.updatedAt),
    subdomain: site.subdomain ?? undefined,
    templateId: site.templateId ?? undefined,
    versions: [],
    chatHistory: [],
    uploadedAssets: [],
  };
}

function mergeProjectFromApi(mapped: WebProject, existing: WebProject | undefined): WebProject {
  if (!existing) return mapped;
  return {
    ...mapped,
    kind: existing.kind === "site" ? "site" : mapped.kind ?? existing.kind ?? "builder",
    siteId: existing.siteId ?? mapped.siteId,
    subdomain: existing.subdomain ?? mapped.subdomain,
    templateId: existing.templateId ?? mapped.templateId,
    family: existing.family ?? mapped.family,
    previewVersion: existing.previewVersion ?? mapped.previewVersion,
    chatHistory: existing.chatHistory.length ? existing.chatHistory : mapped.chatHistory,
    versions: existing.versions.length ? existing.versions : mapped.versions,
    uploadedAssets: existing.uploadedAssets.length
      ? existing.uploadedAssets
      : mapped.uploadedAssets,
    deployedUrl: existing.deployedUrl ?? mapped.deployedUrl,
    prompt: existing.prompt || mapped.prompt,
    description: existing.description || mapped.description,
    status:
      existing.status === "deployed" || existing.status === "generated"
        ? existing.status
        : mapped.status,
  };
}

/** Merge builder + site API rows with local session state (chat history, preview bump). */
export function mergeRemoteProjects(
  builderRows: WebProject[],
  siteRows: WebProject[],
  prev: WebProject[],
): WebProject[] {
  const prevById = new Map(prev.map((p) => [p.id, p]));
  const prevBySiteId = new Map(
    prev.filter((p) => p.siteId).map((p) => [p.siteId as string, p]),
  );
  const merged = new Map<string, WebProject>();

  for (const row of builderRows) {
    merged.set(row.id, mergeProjectFromApi(row, prevById.get(row.id)));
  }
  for (const row of siteRows) {
    const existing = prevBySiteId.get(row.siteId ?? row.id) ?? prevById.get(row.id);
    merged.set(row.id, mergeProjectFromApi(row, existing));
  }
  for (const row of prev) {
    if (row.kind === "site" && !row.siteId && !merged.has(row.id)) {
      merged.set(row.id, row);
    }
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function buildUrl(projectId?: string | null, view?: WebAgentPageView) {
  const params = new URLSearchParams();
  if (projectId) params.set("project", projectId);
  else if (view && view !== "new" && view !== "workspace") params.set("view", view);
  const qs = params.toString();
  return qs ? `${ROUTES.webAgent}?${qs}` : ROUTES.webAgent;
}

function loadPersistedState() {
  if (_cachedPersistedState !== undefined) return _cachedPersistedState;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      _cachedPersistedState = null;
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      _cachedPersistedState = null;
      return null;
    }
    _cachedPersistedState = parsed as {
      projects?: WebProject[];
      deployments?: DeploymentRecord[];
      activeProjectId?: string | null;
      pageView?: WebAgentPageView;
      splitView?: boolean;
    };
    return _cachedPersistedState;
  } catch {
    _cachedPersistedState = null;
    return null;
  }
}

function persistState(payload: {
  projects: WebProject[];
  deployments: DeploymentRecord[];
  activeProjectId: string | null;
  pageView: WebAgentPageView;
  splitView: boolean;
}) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Best effort only; ignore storage quota/permission errors.
  }
}

export function WebAgentProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [projects, setProjects] = useState<WebProject[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [pageView, setPageView] = useState<WebAgentPageView>("new");
  const [splitView, setSplitView] = useState(false);
  const [stateRestored, setStateRestored] = useState(false);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const myProjects = useMemo(() => projects, [projects]);

  const deployedProjects = useMemo(
    () => projects.filter((p) => p.status === "deployed" || p.deployedUrl),
    [projects]
  );

  useEffect(() => {
    const persisted = loadPersistedState();
    if (Array.isArray(persisted?.projects)) setProjects(persisted.projects);
    if (Array.isArray(persisted?.deployments)) setDeployments(persisted.deployments);
    if (
      typeof persisted?.activeProjectId === "string" ||
      persisted?.activeProjectId === null
    ) {
      setActiveProjectId(persisted.activeProjectId ?? null);
    }
    if (
      persisted?.pageView === "workspace" ||
      persisted?.pageView === "my-projects" ||
      persisted?.pageView === "deploy-projects"
    ) {
      setPageView(persisted.pageView);
    }
    if (typeof persisted?.splitView === "boolean") {
      setSplitView(persisted.splitView);
    }
    setStateRestored(true);
  }, []);

  useEffect(() => {
    if (!stateRestored) return;
    persistState({
      projects,
      deployments,
      activeProjectId,
      pageView,
      splitView,
    });
  }, [projects, deployments, activeProjectId, pageView, splitView, stateRestored]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!getToken()) return;
      try {
        const [builderItems, siteItems] = await Promise.all([
          listBuilderProjects(),
          listSites(),
        ]);
        if (cancelled) return;
        const builderRows = builderItems.map(mapBuilderProject);
        const siteRows = siteItems.map(mapSiteDoc);
        setProjects((prev) => mergeRemoteProjects(builderRows, siteRows, prev));
        setActiveProjectId((current) => {
          if (!current) return current;
          const knownIds = new Set([
            ...builderItems.map((item) => item.projectId),
            ...siteItems.map((item) => item.siteId),
          ]);
          return knownIds.has(current) ? current : null;
        });
        setDeployments((prev) =>
          prev.filter(
            (deployment) =>
              builderItems.some((item) => item.projectId === deployment.projectId) ||
              siteItems.some((item) => item.siteId === deployment.projectId),
          ),
        );
      } catch (e) {
        if (cancelled || isUnauthorizedError(e)) return;
        console.warn("web-agent projects unavailable", e);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const startNewProject = useCallback(() => {
    setActiveProjectId(null);
    setPageView("new");
    setSplitView(false);
    router.push(buildUrl());
  }, [router]);

  const showMyProjects = useCallback(() => {
    setActiveProjectId(null);
    setPageView("my-projects");
    setSplitView(false);
    router.push(buildUrl(null, "my-projects"));
  }, [router]);

  const showDeployProjects = useCallback(() => {
    setActiveProjectId(null);
    setPageView("deploy-projects");
    setSplitView(false);
    router.push(buildUrl(null, "deploy-projects"));
  }, [router]);

  const openProject = useCallback(
    (id: string) => {
      setActiveProjectId(id);
      setPageView("workspace");
      setSplitView(true);
      router.push(buildUrl(id));
    },
    [router]
  );

  const syncFromUrl = useCallback((projectId: string | null, view: string | null) => {
    if (projectId) {
      setActiveProjectId(projectId);
      setPageView("workspace");
      setSplitView(true);
      return;
    }
    setActiveProjectId(null);
    if (view === "my-projects") {
      setPageView("my-projects");
      setSplitView(false);
    } else if (view === "deploy-projects") {
      setPageView("deploy-projects");
      setSplitView(false);
    } else {
      setPageView("new");
      setSplitView(false);
    }
  }, []);

  const updateProject = useCallback((updated: WebProject) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      if (exists) return prev.map((p) => (p.id === updated.id ? updated : p));
      return [updated, ...prev];
    });
    setActiveProjectId(updated.id);
    setPageView("workspace");
  }, []);

  const addProject = useCallback((project: WebProject) => {
    setProjects((prev) => [project, ...prev.filter((p) => p.id !== project.id)]);
    setActiveProjectId(project.id);
    setPageView("workspace");
  }, []);

  const deleteProject = useCallback(
    async (id: string) => {
      const target = projects.find((p) => p.id === id);
      try {
        if (target?.kind === "site" && target.siteId) {
          await deleteSite(target.siteId);
        } else {
          await deleteBuilderProject(id);
        }
      } catch (err) {
        if (!isNotFoundError(err)) throw err;
      }
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setDeployments((prev) => prev.filter((d) => d.projectId !== id));
      setActiveProjectId((current) => {
        if (current !== id) return current;
        setPageView("my-projects");
        setSplitView(false);
        router.push(buildUrl(null, "my-projects"));
        return null;
      });
    },
    [router, projects],
  );

  const addDeployment = useCallback((project: WebProject, version: WebsiteVersion) => {
    const now = new Date().toISOString();
    const url =
      project.deployedUrl ??
      `https://${project.name.toLowerCase().replace(/\s+/g, "-")}.dharwin.app`;
    setDeployments((prev) => [
      {
        id: `dep-${Date.now()}`,
        projectId: project.id,
        projectName: project.name,
        status: "live",
        url,
        startedAt: now,
        completedAt: now,
        version: version.label,
      },
      ...prev,
    ]);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, status: "deployed", deployedUrl: url } : p
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      projects,
      deployments,
      activeProject,
      activeProjectId,
      pageView,
      splitView,
      setSplitView,
      startNewProject,
      showMyProjects,
      showDeployProjects,
      openProject,
      syncFromUrl,
      addProject,
      updateProject,
      deleteProject,
      addDeployment,
      myProjects,
      deployedProjects,
    }),
    [
      projects,
      deployments,
      activeProject,
      activeProjectId,
      pageView,
      splitView,
      startNewProject,
      showMyProjects,
      showDeployProjects,
      openProject,
      syncFromUrl,
      addProject,
      updateProject,
      deleteProject,
      addDeployment,
      myProjects,
      deployedProjects,
    ]
  );

  return <WebAgentContext.Provider value={value}>{children}</WebAgentContext.Provider>;
}

export function useWebAgent() {
  const ctx = useContext(WebAgentContext);
  if (!ctx) throw new Error("useWebAgent must be used within WebAgentProvider");
  return ctx;
}

export { SAMPLE_HTML, SAMPLE_CSS, SAMPLE_JS };
