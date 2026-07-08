"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { WebAgentPageView } from "@/lib/constants";
import { ROUTES } from "@/lib/constants";
import {
  INITIAL_PROJECTS,
  DEPLOYMENT_HISTORY,
  SAMPLE_CSS,
  SAMPLE_HTML,
  SAMPLE_JS,
  type DeploymentRecord,
  type WebProject,
  type WebsiteVersion,
} from "@/lib/web-agent-data";

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
  addDeployment: (project: WebProject, version: WebsiteVersion) => void;
  myProjects: WebProject[];
  deployedProjects: WebProject[];
};

const WebAgentContext = createContext<WebAgentContextValue | null>(null);

function buildUrl(projectId?: string | null, view?: WebAgentPageView) {
  const params = new URLSearchParams();
  if (projectId) params.set("project", projectId);
  else if (view && view !== "new" && view !== "workspace") params.set("view", view);
  const qs = params.toString();
  return qs ? `${ROUTES.webAgent}?${qs}` : ROUTES.webAgent;
}

export function WebAgentProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [projects, setProjects] = useState<WebProject[]>(INITIAL_PROJECTS);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>(DEPLOYMENT_HISTORY);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [pageView, setPageView] = useState<WebAgentPageView>("new");
  const [splitView, setSplitView] = useState(false);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const myProjects = useMemo(() => projects, [projects]);

  const deployedProjects = useMemo(
    () => projects.filter((p) => p.status === "deployed" || p.deployedUrl),
    [projects]
  );

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

  const syncFromUrl = useCallback(
    (projectId: string | null, view: string | null) => {
      if (projectId) {
        const project = projects.find((p) => p.id === projectId);
        if (project) {
          setActiveProjectId(projectId);
          setPageView("workspace");
          setSplitView(true);
        }
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
    },
    [projects]
  );

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

  const addDeployment = useCallback((project: WebProject, version: WebsiteVersion) => {
    const now = new Date().toISOString();
    const url = `https://${project.name.toLowerCase().replace(/\s+/g, "-")}.dharwin.app`;
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
