"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PreviewDevice, WorkspaceTab } from "@/lib/constants";
import { WORKSPACE_TABS } from "@/lib/constants";
import type { DeploymentRecord, WebProject, WebsiteVersion } from "@/lib/web-agent-data";
import { DEPLOY_STAGES, SAMPLE_CSS, SAMPLE_HTML, SAMPLE_JS } from "@/lib/web-agent-data";
import type { GenerationState } from "./hooks/use-generation-engine";
import { PreviewSkeleton } from "./ui/skeleton-loaders";
import { CodeExplorer } from "./ui/code-explorer";
import { GenerationLoadingPanel } from "./ui/generation-loading-panel";
import { SuccessToast } from "./ui/success-toast";
import { getToken } from "@/lib/auth";
import {
  listVersions,
  publishSite,
  restoreVersion,
  SitesApiError,
  SITES_BASE,
} from "@/lib/sites-api";
import type { SiteVersionSummary } from "@/lib/sites-types";
import {
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  MonitorIcon,
  RefreshIcon,
  RocketIcon,
  SmartphoneIcon,
  SparklesIcon,
  TabletIcon,
} from "@/components/icons";

type WorkspacePanelProps = {
  project: WebProject | null;
  generation: GenerationState;
  deployments: DeploymentRecord[];
  onUpdateProject: (project: WebProject) => void;
  onDeploy: (project: WebProject, version: WebsiteVersion) => void;
  onRegenerate: () => void;
};

const DEVICE_OPTIONS: { id: PreviewDevice; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "desktop", label: "Desktop", icon: MonitorIcon },
  { id: "tablet", label: "Tablet", icon: TabletIcon },
  { id: "mobile", label: "Mobile", icon: SmartphoneIcon },
];

function withPreviewLinkGuard(doc: string) {
  const guard = `<script>(function(){document.addEventListener("click",function(e){var t=e.target;if(!t||!t.closest)return;var btn=t.closest("button");if(btn){e.preventDefault();e.stopPropagation();return;}var a=t.closest("a[href]");if(!a)return;var href=(a.getAttribute("href")||"").trim();if(!href)return;if(href==="#"){e.preventDefault();e.stopPropagation();return;}if(href.charAt(0)==="#"){e.preventDefault();var id=href.slice(1);if(!id)return;var target=document.getElementById(id)||document.querySelector('[id="'+id+'"]');if(target){target.scrollIntoView({behavior:"smooth",block:"start"});}return;}if(/^(mailto:|tel:|sms:)/i.test(href))return;e.preventDefault();e.stopPropagation();},true);})();</script>`;
  if (/<\/body>/i.test(doc)) return doc.replace(/<\/body>/i, `${guard}</body>`);
  if (/<\/html>/i.test(doc)) return doc.replace(/<\/html>/i, `${guard}</html>`);
  return `${doc}${guard}`;
}

export function WorkspacePanel({
  project,
  generation,
  deployments,
  onUpdateProject,
  onDeploy,
  onRegenerate,
}: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("preview");
  const [activeVersionId, setActiveVersionId] = useState("");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deployStage, setDeployStage] = useState(0);
  const [deployProgress, setDeployProgress] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [siteVersions, setSiteVersions] = useState<SiteVersionSummary[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const isSiteProject = project?.kind === "site";
  const isGenerating =
    generation.phase === "thinking" ||
    generation.phase === "building" ||
    generation.phase === "generating";
  const hasWebsite = Boolean(
    project &&
      ((isSiteProject && project.siteId) || project.versions.length > 0),
  );
  const showWorkspace = hasWebsite && !isGenerating && project?.status !== "generating";

  const activeVersion = useMemo(() => {
    if (!project) return null;
    if (project.versions.length) {
      return (
        project.versions.find((v) => v.id === activeVersionId) ??
        project.versions[project.versions.length - 1]
      );
    }
    if (isSiteProject && project.siteId) {
      return {
        id: project.siteId,
        label: "Live draft",
        createdAt: project.updatedAt,
        prompt: project.prompt,
        html: "",
        css: "",
        js: "",
      } satisfies WebsiteVersion;
    }
    return null;
  }, [project, activeVersionId, isSiteProject]);

  useEffect(() => {
    if (project?.versions.length) {
      setActiveVersionId(project.versions[project.versions.length - 1].id);
    } else {
      setActiveVersionId("");
    }
  }, [project?.id, project?.versions.length]);

  const html = activeVersion?.html ?? SAMPLE_HTML;
  const css = activeVersion?.css ?? SAMPLE_CSS;
  const js = activeVersion?.js ?? SAMPLE_JS;

  const previewDoc = useMemo(() => {
    if (isSiteProject) return "";
    // Generated templates are full documents; rebuilding them dropped the
    // <head> <link> tags (Bootstrap, fonts) and broke every layout class.
    if (/<html[\s>]/i.test(html)) return withPreviewLinkGuard(html);
    return withPreviewLinkGuard(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? ""}<script>${js}</script></body></html>`
    );
  }, [html, css, js, isSiteProject]);

  const draftPreviewUrl = useMemo(() => {
    if (!isSiteProject || !project?.siteId) return null;
    if (!getToken()) return null;
    const version = project.previewVersion ?? 0;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    if (!origin) return null;
    return `${origin}/sites/preview/draft/${encodeURIComponent(project.siteId)}?v=${version}`;
  }, [isSiteProject, project?.siteId, project?.previewVersion]);

  const sitePreviewSrc = draftPreviewUrl;

  useEffect(() => {
    if (!isSiteProject || !project?.siteId) {
      setSiteVersions([]);
      return;
    }
    let cancelled = false;
    void listVersions(project.siteId)
      .then((rows) => {
        if (!cancelled) setSiteVersions(rows);
      })
      .catch(() => {
        if (!cancelled) setSiteVersions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isSiteProject, project?.siteId, project?.previewVersion]);

  useEffect(() => {
    if (activeTab === "preview" && hasWebsite) {
      setPreviewLoading(true);
      const t = setTimeout(() => setPreviewLoading(false), 700);
      return () => clearTimeout(t);
    }
    if (activeTab === "code" && hasWebsite) {
      setCodeLoading(true);
      const t = setTimeout(() => setCodeLoading(false), 500);
      return () => clearTimeout(t);
    }
  }, [activeTab, activeVersionId, hasWebsite]);

  const handleOpenPreview = () => {
    if (draftPreviewUrl) {
      window.open(draftPreviewUrl, "_blank");
      return;
    }
    const blob = new Blob([previewDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const content = `<!-- index.html -->\n${html}\n\n/* styles.css */\n${css}\n\n// script.js\n${js}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(project?.name ?? "website").toLowerCase().replace(/\s+/g, "-")}-source.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setExporting(false);
      setSuccessMessage("Source code exported!");
    }, 600);
  };

  const handleDeploy = useCallback(() => {
    if (!project) return;
    if (!isSiteProject && !activeVersion) return;
    setActiveTab("deploy");
    setDeployError(null);

    if (isSiteProject) {
      if (!project.siteId) {
        setDeployError("Site is not ready to publish yet.");
        return;
      }
      setIsDeploying(true);
      setDeployStage(0);
      setDeployProgress(20);
      void (async () => {
        try {
          setDeployStage(1);
          setDeployProgress(45);
          const result = await publishSite(project.siteId!);
          setDeployStage(DEPLOY_STAGES.length - 1);
          setDeployProgress(100);
          const subdomain = result.site.subdomain ?? project.subdomain;
          const url = subdomain
            ? `${SITES_BASE}/sites/preview/${encodeURIComponent(subdomain)}`
            : project.deployedUrl;
          const updated = {
            ...project,
            status: "deployed" as const,
            subdomain: subdomain ?? project.subdomain,
            deployedUrl: url,
            updatedAt: new Date().toISOString(),
          };
          onUpdateProject(updated);
          if (url) onDeploy(updated, activeVersion ?? {
            id: project.siteId ?? project.id,
            label: "Published",
            createdAt: new Date().toISOString(),
            prompt: project.prompt,
            html: "",
            css: "",
            js: "",
          });
          setSuccessMessage("Website published successfully!");
        } catch (e) {
          const message =
            e instanceof SitesApiError
              ? typeof e.detail === "string"
                ? e.detail
                : e.message
              : "Publish failed. Please try again.";
          setDeployError(message);
        } finally {
          setIsDeploying(false);
        }
      })();
      return;
    }

    if (!activeVersion) return;
    setIsDeploying(true);
    setDeployStage(0);
    setDeployProgress(0);

    let stage = 0;
    const interval = setInterval(() => {
      stage++;
      setDeployStage(stage);
      setDeployProgress((stage / DEPLOY_STAGES.length) * 100);
      if (stage >= DEPLOY_STAGES.length) {
        clearInterval(interval);
        setIsDeploying(false);
        const url = `https://${project.name.toLowerCase().replace(/\s+/g, "-")}.dharwin.app`;
        onDeploy(project, activeVersion);
        onUpdateProject({ ...project, status: "deployed", deployedUrl: url });
        setSuccessMessage("Website deployed successfully!");
      }
    }, 750);
  }, [project, activeVersion, onDeploy, onUpdateProject, isSiteProject]);

  const handleRestoreSiteVersion = useCallback(
    async (versionId: string) => {
      if (!project?.siteId) return;
      setRestoringVersionId(versionId);
      try {
        const result = await restoreVersion(project.siteId, versionId);
        onUpdateProject({
          ...project,
          previewVersion: (project.previewVersion ?? 0) + 1,
          updatedAt: new Date().toISOString(),
          subdomain: result.site.subdomain ?? project.subdomain,
          templateId: result.site.templateId ?? project.templateId,
        });
        setSuccessMessage("Restored an earlier site version.");
        setActiveTab("preview");
        const rows = await listVersions(project.siteId);
        setSiteVersions(rows);
      } catch (err) {
        setDeployError(
          err instanceof SitesApiError
            ? typeof err.detail === "string"
              ? err.detail
              : err.message
            : "Could not restore that version.",
        );
      } finally {
        setRestoringVersionId(null);
      }
    },
    [project, onUpdateProject],
  );

  const projectDeployments = deployments.filter((d) => d.projectId === project?.id);

  if (!showWorkspace) {
    if (isGenerating || project?.status === "generating") {
      return <GenerationLoadingPanel generation={generation} />;
    }

    return (
      <div className="wa-empty-workspace flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center wa-animate-fade-up">
          <div className="relative mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-defaultborder/40 bg-white shadow-sm">
              <EyeIcon className="h-9 w-9 text-textmuted/40" />
            </div>
            <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-green/10">
              <SparklesIcon className="h-4 w-4 text-brand-green" />
            </div>
          </div>
          <h3 className="m-0 font-poppins text-xl font-semibold text-defaulttextcolor">Workspace</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-textmuted">
            Your generated website will appear here. Start by describing what you want to build in the chat panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col wa-workspace-reveal">
      <WorkspaceToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        project={project}
        activeVersion={activeVersion}
        onVersionChange={setActiveVersionId}
        onRegenerate={onRegenerate}
        onExport={handleExport}
        onDeploy={handleDeploy}
        onOpenPreview={handleOpenPreview}
        exporting={exporting}
        isDeploying={isDeploying}
      />

      <div className="relative flex-1 overflow-hidden">
        {activeTab === "preview" && (
          <div key="preview" className="wa-animate-tab flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-center gap-1 border-b border-defaultborder/40 bg-white/60 px-4 py-2">
              {DEVICE_OPTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPreviewDevice(id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    previewDevice === id ? "bg-white text-brand-green shadow-sm" : "text-textmuted hover:text-defaulttextcolor"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto bg-white p-0">
              {previewLoading ? (
                <div className="h-full min-h-[400px]"><PreviewSkeleton /></div>
              ) : (
                <div className={`wa-animate-preview wa-device-frame wa-device-${previewDevice} h-full min-h-[400px] w-full overflow-hidden`}>
                  {isSiteProject && sitePreviewSrc ? (
                    <iframe
                      key={sitePreviewSrc}
                      title="Site preview"
                      src={sitePreviewSrc}
                      className="h-full w-full border-0"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <iframe
                      title="Preview"
                      srcDoc={previewDoc}
                      className="h-full w-full border-0"
                      sandbox="allow-scripts"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "code" && project && (
          <div key="code" className="wa-animate-tab h-full">
            <CodeExplorer project={project} html={html} css={css} js={js} loading={codeLoading} />
          </div>
        )}

        {activeTab === "deploy" && (
          <div key="deploy" className="wa-animate-tab h-full overflow-y-auto custom-scrollbar p-6">
            <div className="mx-auto max-w-lg space-y-6 flex flex-col gap-4">
              <div className="box wa-animate-fade-up">
                <div className="box-header">
                  <div>
                    <h3 className="box-title">Deployment Status</h3>
                    <p className="box-subtitle">Monitor your live deployment and history</p>
                  </div>
                </div>
                <div className="box-body space-y-4">
                  {isDeploying && (
                    <div className="wa-animate-fade-in rounded-xl border border-brand-green/20 bg-brand-green/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 animate-[wa-spin-slow_1s_linear_infinite] rounded-full border-2 border-brand-green/20 border-t-brand-green" />
                        <div>
                          <p className="m-0 text-sm font-semibold text-defaulttextcolor">Deploying...</p>
                          <p className="m-0 text-xs text-brand-green">{DEPLOY_STAGES[Math.min(deployStage, DEPLOY_STAGES.length - 1)]}</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-defaultborder/30">
                        <div className="wa-progress-bar-fill h-full rounded-full bg-brand-green" style={{ width: `${deployProgress}%` }} />
                      </div>
                    </div>
                  )}
                  {!isDeploying && !project?.deployedUrl && (
                    <p className="m-0 rounded-xl bg-light p-4 text-sm text-textmuted mb-4">
                      Use the <strong className="text-defaulttextcolor">Deploy</strong> button in the toolbar above to publish your site.
                    </p>
                  )}
                  {deployError && !isDeploying && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950 mb-4">
                      <p className="m-0 font-medium">{deployError}</p>
                    </div>
                  )}
                  {project?.deployedUrl && !isDeploying && (
                    <div className="wa-animate-scale-in flex items-center gap-3 rounded-xl border border-brand-green/20 bg-brand-green/8 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/15">
                        <RocketIcon className="h-5 w-5 text-brand-green" />
                      </div>
                      <div className="min-w-0">
                        <p className="m-0 text-sm font-semibold text-brand-green">Live</p>
                        <a href={project.deployedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-green hover:underline">
                          {project.deployedUrl}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-light p-3">
                      <p className="m-0 text-xs text-textmuted">Version</p>
                      <p className="m-0 mt-0.5 font-medium">{activeVersion?.label ?? "—"}</p>
                    </div>
                    <div className="rounded-xl bg-light p-3">
                      <p className="m-0 text-xs text-textmuted">Status</p>
                      <p className="m-0 mt-0.5 font-medium capitalize">{project?.status ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {projectDeployments.length > 0 && (
                <div className="box wa-animate-fade-up wa-stagger-2">
                  <div className="box-header">
                    <h3 className="box-title">Deployment History</h3>
                  </div>
                  <div className="box-body space-y-3">
                    {projectDeployments.map((dep) => (
                      <div key={dep.id} className="flex items-center justify-between rounded-xl border border-defaultborder/50 p-3 transition-colors hover:bg-light/50">
                        <div>
                          <p className="m-0 text-sm font-medium">{dep.version}</p>
                          <p className="m-0 text-xs text-textmuted">{new Date(dep.startedAt).toLocaleString()}</p>
                        </div>
                        <span className={`badge ${dep.status === "live" ? "status-completed" : dep.status === "failed" ? "status-failed" : "status-in-progress"}`}>
                          {dep.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "info" && project && (
          <div key="info" className="wa-animate-tab h-full overflow-y-auto custom-scrollbar p-6">
            <div className="mx-auto max-w-lg space-y-5 flex flex-col gap-4">
              <div className="box wa-animate-fade-up">
                <div className="box-header"><h3 className="box-title">Project Information</h3></div>
                <div className="box-body space-y-4">
                  <InfoRow label="Name" value={project.name} />
                  <InfoRow label="Created" value={new Date(project.createdAt).toLocaleDateString()} />
                  <InfoRow label="Last updated" value={new Date(project.updatedAt).toLocaleDateString()} />
                  <InfoRow label="Versions" value={String(project.versions.length)} />
                  <InfoRow label="Assets" value={project.uploadedAssets.length ? project.uploadedAssets.join(", ") : "None"} />
                  <div>
                    <p className="m-0 text-xs font-medium text-textmuted">Original prompt</p>
                    <p className="m-0 mt-1 text-sm leading-relaxed text-defaulttextcolor">{project.prompt}</p>
                  </div>
                </div>
              </div>

              <div className="box wa-animate-fade-up wa-stagger-2">
                <div className="box-header"><h3 className="box-title">Version History</h3></div>
                <div className="box-body space-y-2">
                  {isSiteProject && project.siteId ? (
                    siteVersions.length ? (
                      siteVersions.map((v) => (
                        <div
                          key={v.versionId}
                          className="flex w-full items-center justify-between rounded-xl border border-defaultborder/50 p-3"
                        >
                          <div>
                            <p className="m-0 text-sm font-medium">{v.label || v.versionId}</p>
                            <p className="m-0 text-xs text-textmuted">
                              {new Date(v.createdAt * 1000).toLocaleString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={restoringVersionId === v.versionId}
                            onClick={() => handleRestoreSiteVersion(v.versionId)}
                            className="ti-btn ti-btn-light ti-btn-sm"
                          >
                            {restoringVersionId === v.versionId ? "Restoring..." : "Restore"}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="m-0 text-sm text-textmuted">No saved versions yet.</p>
                    )
                  ) : (
                    [...project.versions].reverse().map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => { setActiveVersionId(v.id); setActiveTab("preview"); }}
                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all hover:border-brand-green/30 ${
                          v.id === activeVersionId ? "border-brand-green/40 bg-brand-green/5" : "border-defaultborder/50"
                        }`}
                      >
                        <div>
                          <p className="m-0 text-sm font-medium">{v.label}</p>
                          <p className="m-0 text-xs text-textmuted">{new Date(v.createdAt).toLocaleString()}</p>
                        </div>
                        {v.id === activeVersionId && <span className="badge bg-brand-green/10 text-brand-green">Active</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {successMessage && <SuccessToast message={successMessage} onDismiss={() => setSuccessMessage(null)} />}
    </div>
  );
}

function WorkspaceToolbar({
  activeTab,
  onTabChange,
  project,
  activeVersion,
  onVersionChange,
  onRegenerate,
  onExport,
  onDeploy,
  onOpenPreview,
  exporting,
  isDeploying,
  disabled,
}: {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  project?: WebProject | null;
  activeVersion?: WebsiteVersion | null;
  onVersionChange?: (id: string) => void;
  onRegenerate?: () => void;
  onExport?: () => void;
  onDeploy?: () => void;
  onOpenPreview?: () => void;
  exporting?: boolean;
  isDeploying?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="wa-workspace-toolbar flex shrink-0 flex-wrap items-center gap-2 px-4 py-2.5">
      <div className="flex items-center gap-1 rounded-xl bg-[#eef0f3]/80 p-1">
        {WORKSPACE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={disabled}
            onClick={() => onTabChange(tab.id)}
            className={`wa-tab-pill ${activeTab === tab.id ? "wa-tab-pill-active" : "wa-tab-pill-inactive"} disabled:opacity-40`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!disabled && project && (
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {project.versions.length > 1 && onVersionChange && (
            <select
              value={activeVersion?.id ?? ""}
              onChange={(e) => onVersionChange(e.target.value)}
              className="hidden rounded-lg border border-defaultborder/60 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-brand-green/40 md:block"
            >
              {project.versions.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          )}
          <button type="button" onClick={onOpenPreview} className="ti-btn ti-btn-light ti-btn-sm hidden sm:inline-flex" title="Open in new tab">
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onRegenerate} className="ti-btn ti-btn-light ti-btn-sm hidden md:inline-flex">
            <RefreshIcon className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onExport} disabled={exporting} className="ti-btn ti-btn-light ti-btn-sm">
            <DownloadIcon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{exporting ? "..." : "Export"}</span>
          </button>
          <button type="button" onClick={onDeploy} disabled={isDeploying} className="ti-btn ti-btn-primary-full ti-btn-sm wa-btn-glow gap-1.5">
            <RocketIcon className="h-3.5 w-3.5" />
            {isDeploying ? "Deploying..." : "Deploy"}
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-defaultborder/40 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-textmuted">{label}</span>
      <span className="text-sm font-medium text-defaulttextcolor">{value}</span>
    </div>
  );
}
