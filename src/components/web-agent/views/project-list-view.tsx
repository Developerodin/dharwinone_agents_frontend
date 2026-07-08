"use client";

import type { WebProject } from "@/lib/web-agent-data";
import { useWebAgent } from "@/components/web-agent/web-agent-context";
import {
  ChevronRightIcon,
  ExternalLinkIcon,
  FolderIcon,
  RocketIcon,
  SparklesIcon,
} from "@/components/icons";

type ProjectListViewProps = {
  variant: "my" | "deployed";
};

const STATUS_STYLES: Record<WebProject["status"], { label: string; className: string }> = {
  draft: { label: "Draft", className: "wa-status-draft" },
  generated: { label: "Generated", className: "wa-status-generated" },
  deployed: { label: "Deployed", className: "wa-status-deployed" },
  generating: { label: "Generating", className: "wa-status-generating" },
};

export function ProjectListView({ variant }: ProjectListViewProps) {
  const { myProjects, deployedProjects, openProject, startNewProject } = useWebAgent();
  const projects = variant === "my" ? myProjects : deployedProjects;

  const title = variant === "my" ? "My Projects" : "Deploy Projects";
  const subtitle =
    variant === "my"
      ? "All websites you've created with Web Agent"
      : "Live websites deployed to production";

  return (
    <div className="wa-page-shell h-full overflow-y-auto custom-scrollbar">
      <div className="wa-page-inner wa-animate-fade-up">
        <header className="wa-page-header">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="wa-page-eyebrow">
                {variant === "my" ? <FolderIcon className="h-3.5 w-3.5" /> : <RocketIcon className="h-3.5 w-3.5" />}
                Web Agent
              </div>
              <h1 className="wa-page-title">{title}</h1>
              <p className="wa-page-subtitle">{subtitle}</p>
            </div>
            {variant === "my" && (
              <button type="button" onClick={startNewProject} className="wa-btn-primary shrink-0">
                <SparklesIcon className="h-4 w-4" />
                New project
              </button>
            )}
          </div>
        </header>

        {projects.length === 0 ? (
          <div className="wa-empty-card wa-animate-scale-in">
            <div className="wa-empty-icon">
              {variant === "my" ? <FolderIcon className="h-10 w-10" /> : <RocketIcon className="h-10 w-10" />}
            </div>
            <h3>{variant === "my" ? "No projects yet" : "No deployed projects"}</h3>
            <p>
              {variant === "my"
                ? "Start a new project to build your first AI-generated website."
                : "Deploy a project to see it listed here."}
            </p>
            {variant === "my" && (
              <button type="button" onClick={startNewProject} className="wa-btn-primary mt-2">
                <SparklesIcon className="h-4 w-4" />
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="wa-project-grid">
            {projects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => openProject(project.id)}
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  style,
}: {
  project: WebProject;
  onOpen: () => void;
  style?: React.CSSProperties;
}) {
  const status = STATUS_STYLES[project.status];

  return (
    <article
      className="wa-project-card wa-hover-lift wa-animate-fade-up"
      style={style}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      role="button"
      tabIndex={0}
    >
      <div className="wa-project-card-preview">
        <div className="wa-project-card-mockup">
          <div className="wa-mockup-bar">
            <span /><span /><span />
          </div>
          <div className="wa-mockup-body">
            <div className="wa-mockup-line w-2/3" />
            <div className="wa-mockup-line w-full" />
            <div className="wa-mockup-grid">
              <span /><span /><span />
            </div>
          </div>
        </div>
        <span className={`wa-status-badge ${status.className}`}>{status.label}</span>
      </div>

      <div className="wa-project-card-body">
        <h3 className="wa-project-card-title">{project.name}</h3>
        <p className="wa-project-card-desc">{project.description}</p>

        <div className="wa-project-card-meta">
          <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
          <span>·</span>
          <span>{project.versions.length} version{project.versions.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="wa-project-card-footer">
          {project.deployedUrl ? (
            <a
              href={project.deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="wa-project-link"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
              <ExternalLinkIcon className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-xs text-textmuted">Not deployed</span>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="wa-btn-ghost text-xs"
          >
            Open
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
