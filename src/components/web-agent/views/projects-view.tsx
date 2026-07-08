"use client";

import type { WebProject } from "@/lib/web-agent-data";
import { ExternalLinkIcon, EyeIcon, FolderIcon } from "@/components/icons";

type ProjectsViewProps = {
  projects: WebProject[];
  onOpenProject: (project: WebProject) => void;
};

const STATUS_STYLES: Record<WebProject["status"], { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  generated: { label: "Generated", className: "bg-blue-50 text-blue-700" },
  deployed: { label: "Deployed", className: "bg-emerald-50 text-emerald-700" },
  generating: { label: "Generating", className: "bg-amber-50 text-amber-700" },
};

export function ProjectsView({ projects, onOpenProject }: ProjectsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="m-0 text-lg font-bold tracking-tight text-defaulttextcolor">Your Projects</h2>
          <p className="m-0 mt-1 text-sm text-textmuted">
            {projects.length} website{projects.length !== 1 ? "s" : ""} created
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="box">
          <div className="box-body flex flex-col items-center py-16 text-center">
            <FolderIcon className="h-12 w-12 text-textmuted/30" />
            <h3 className="mt-4 text-base font-semibold text-defaulttextcolor">No projects yet</h3>
            <p className="mt-1 text-sm text-textmuted">Create your first website from the Create tab</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, i) => {
            const status = STATUS_STYLES[project.status];
            return (
              <article
                key={project.id}
                className="box wa-hover-lift cursor-pointer overflow-hidden transition-all"
                style={{ animation: `wa-fade-up 0.4s ease-out ${i * 0.06}s both` }}
                onClick={() => onOpenProject(project)}
                onKeyDown={(e) => e.key === "Enter" && onOpenProject(project)}
                role="button"
                tabIndex={0}
              >
                <div className="relative h-36 bg-gradient-to-br from-brand-green/10 via-white to-brand-navy/5">
                  <div className="absolute inset-4 rounded-xl border border-defaultborder/30 bg-white/80 p-3 shadow-sm">
                    <div className="h-2 w-16 rounded bg-brand-green/20" />
                    <div className="mt-3 h-8 w-full rounded bg-defaultborder/30" />
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <div className="h-10 rounded bg-brand-green/10" />
                      <div className="h-10 rounded bg-brand-navy/10" />
                      <div className="h-10 rounded bg-amber-100" />
                    </div>
                  </div>
                  <span className={`badge absolute right-3 top-3 ${status.className}`}>{status.label}</span>
                </div>
                <div className="box-body !pt-4">
                  <h3 className="m-0 truncate text-[0.9375rem] font-semibold text-defaulttextcolor">{project.name}</h3>
                  <p className="m-0 mt-1 line-clamp-2 text-xs leading-relaxed text-textmuted">{project.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-textmuted">
                      {project.versions.length} version{project.versions.length !== 1 ? "s" : ""}
                      {" · "}
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      {project.deployedUrl && (
                        <a
                          href={project.deployedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-green hover:bg-brand-green/10 transition-colors"
                          title="View live site"
                        >
                          <ExternalLinkIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-textmuted hover:bg-light hover:text-brand-green transition-colors"
                        title="Open in builder"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
