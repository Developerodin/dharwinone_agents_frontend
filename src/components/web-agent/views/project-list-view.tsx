"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { WebProject } from "@/lib/web-agent-data";
import { useWebAgent } from "@/components/web-agent/web-agent-context";
import { ErrorToast } from "@/components/web-agent/ui/error-toast";
import { SuccessToast } from "@/components/web-agent/ui/success-toast";
import {
  CheckIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  FolderIcon,
  RocketIcon,
  SparklesIcon,
  TrashIcon,
} from "@/components/icons";
import { BuilderApiError } from "@/lib/builder-api";

type ProjectListViewProps = {
  variant: "my" | "deployed";
};

const STATUS_STYLES: Record<WebProject["status"], { label: string; className: string }> = {
  draft: { label: "Draft", className: "wa-status-draft" },
  generated: { label: "Generated", className: "wa-status-generated" },
  deployed: { label: "Deployed", className: "wa-status-deployed" },
  generating: { label: "Generating", className: "wa-status-generating" },
};

function deleteErrorMessage(err: unknown): string {
  if (err instanceof BuilderApiError) {
    return (
      err.message.replace(/^API \d+: [^\s]+(?:\s-\s)?/, "").trim() ||
      "Could not delete project."
    );
  }
  return "Could not delete project. Please try again.";
}

function SelectCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className="wa-select-checkbox">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
      />
    </label>
  );
}

export function ProjectListView({ variant }: ProjectListViewProps) {
  const { myProjects, deployedProjects, openProject, startNewProject, deleteProject } =
    useWebAgent();
  const projects = variant === "my" ? myProjects : deployedProjects;
  const [selectionMode, setSelectionMode] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<WebProject[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectable = variant === "my";
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const deletingSet = useMemo(() => new Set(deletingIds), [deletingIds]);
  const allSelected = selectable && projects.length > 0 && selectedIds.length === projects.length;
  const someSelected = selectable && selectedIds.length > 0 && !allSelected;
  const isDeleting = deletingIds.length > 0;

  const title = variant === "my" ? "My Projects" : "Deploy Projects";
  const subtitle =
    variant === "my"
      ? "All websites you've created with Web Agent"
      : "Live websites deployed to production";

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds([]);
  }, []);

  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
  }, []);

  useEffect(() => {
    if (!selectionMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") exitSelectionMode();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectionMode, exitSelectionMode]);

  const toggleSelected = useCallback((projectId: string) => {
    setSelectedIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.length === projects.length ? [] : projects.map((project) => project.id),
    );
  }, [projects]);

  const handleDeleteRequest = useCallback((project: WebProject) => {
    setPendingDelete([project]);
  }, []);

  const handleBulkDeleteRequest = useCallback(() => {
    const targets = projects.filter((project) => selectedSet.has(project.id));
    if (targets.length === 0) return;
    setPendingDelete(targets);
  }, [projects, selectedSet]);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete?.length) return;
    const targets = pendingDelete;
    setPendingDelete(null);
    setDeletingIds(targets.map((project) => project.id));
    try {
      const results = await Promise.allSettled(
        targets.map((project) => deleteProject(project.id)),
      );
      const succeededIds = targets
        .filter((_, index) => results[index].status === "fulfilled")
        .map((project) => project.id);
      const failed = results.filter((result) => result.status === "rejected");

      setSelectedIds((prev) => prev.filter((id) => !succeededIds.includes(id)));

      if (failed.length === 0) {
        setSuccessMessage(
          targets.length === 1
            ? `"${targets[0].name}" was deleted.`
            : `${targets.length} projects deleted.`,
        );
        if (targets.length > 1) exitSelectionMode();
        return;
      }

      if (succeededIds.length > 0) {
        setSuccessMessage(
          `${succeededIds.length} project${succeededIds.length !== 1 ? "s" : ""} deleted.`,
        );
      }

      const firstError = failed[0]?.status === "rejected" ? failed[0].reason : null;
      setErrorMessage(
        failed.length === targets.length
          ? deleteErrorMessage(firstError)
          : `${failed.length} project${failed.length !== 1 ? "s" : ""} could not be deleted.`,
      );
    } finally {
      setDeletingIds([]);
    }
  }, [pendingDelete, deleteProject, exitSelectionMode]);

  return (
    <div className="wa-page-shell h-full overflow-y-auto custom-scrollbar">
      <div className="wa-page-inner wa-animate-fade-up">
        <header className="wa-page-header">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="wa-page-eyebrow">
                {variant === "my" ? (
                  <FolderIcon className="h-3.5 w-3.5" />
                ) : (
                  <RocketIcon className="h-3.5 w-3.5" />
                )}
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

          {selectable && projects.length > 0 && !selectionMode && (
            <div className="wa-list-meta">
              <div>
                <p className="wa-list-meta-count">
                  {projects.length} project{projects.length !== 1 ? "s" : ""}
                </p>
                <p className="wa-list-meta-hint">Select multiple projects to delete in one step.</p>
              </div>
              <button
                type="button"
                onClick={enterSelectionMode}
                className="wa-select-mode-btn"
                aria-pressed={false}
              >
                <CheckIcon className="h-4 w-4" />
                Select
              </button>
            </div>
          )}

          {selectable && projects.length > 0 && selectionMode && (
            <div
              className="wa-bulk-toolbar"
              role="toolbar"
              aria-label="Project selection actions"
            >
              <div className="wa-bulk-selectall">
                <SelectCheckbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  disabled={isDeleting}
                  label={allSelected ? "Deselect all projects" : "Select all projects"}
                  onChange={toggleSelectAll}
                />
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  disabled={isDeleting}
                  className="wa-bulk-label"
                  aria-live="polite"
                >
                  {allSelected
                    ? "All selected"
                    : someSelected
                      ? `${selectedIds.length} of ${projects.length} selected`
                      : "Select all"}
                </button>
              </div>

              <div className="wa-bulk-toolbar-right">
                <button
                  type="button"
                  onClick={exitSelectionMode}
                  disabled={isDeleting}
                  className="wa-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDeleteRequest}
                  disabled={isDeleting || selectedIds.length === 0}
                  className="wa-btn-danger"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                  {selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
                </button>
              </div>
            </div>
          )}
        </header>

        {projects.length === 0 ? (
          <div className="wa-empty-card wa-animate-scale-in">
            <div className="wa-empty-icon">
              {variant === "my" ? (
                <FolderIcon className="h-10 w-10" />
              ) : (
                <RocketIcon className="h-10 w-10" />
              )}
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
                onDelete={
                  variant === "my" && !selectionMode
                    ? () => handleDeleteRequest(project)
                    : undefined
                }
                selectionMode={selectable && selectionMode}
                selected={selectedSet.has(project.id)}
                onToggleSelect={() => toggleSelected(project.id)}
                deleting={deletingSet.has(project.id)}
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {pendingDelete && pendingDelete.length > 0 && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => setPendingDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className="w-full max-w-md rounded-2xl border border-defaultborder/60 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-project-title" className="m-0 text-lg font-semibold text-defaulttextcolor">
              {pendingDelete.length === 1 ? "Delete project?" : `Delete ${pendingDelete.length} projects?`}
            </h2>
            <p className="m-0 mt-2 text-sm leading-relaxed text-textmuted">
              {pendingDelete.length === 1 ? (
                <>
                  This will permanently delete{" "}
                  <span className="font-medium text-defaulttextcolor">
                    {pendingDelete[0].name}
                  </span>{" "}
                  and all of its versions, chat history, and generated content. This action cannot
                  be undone.
                </>
              ) : (
                <>
                  This will permanently delete{" "}
                  <span className="font-medium text-defaulttextcolor">
                    {pendingDelete.length} projects
                  </span>{" "}
                  and all of their versions, chat history, and generated content. This action
                  cannot be undone.
                </>
              )}
            </p>
            {pendingDelete.length > 1 && pendingDelete.length <= 5 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-defaulttextcolor">
                {pendingDelete.map((project) => (
                  <li key={project.id}>{project.name}</li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="wa-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                className="wa-btn-danger"
              >
                <TrashIcon className="h-4 w-4" />
                {pendingDelete.length === 1 ? "Delete project" : "Delete selected"}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <ErrorToast message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      )}
      {successMessage && (
        <SuccessToast message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onDelete,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  deleting = false,
  style,
}: {
  project: WebProject;
  onOpen: () => void;
  onDelete?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  deleting?: boolean;
  style?: CSSProperties;
}) {
  const status = STATUS_STYLES[project.status];

  const handleCardActivate = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect();
      return;
    }
    onOpen();
  };

  return (
    <article
      className={[
        "wa-project-card wa-hover-lift wa-animate-fade-up",
        selectionMode ? "wa-project-card--selectable" : "",
        selected ? "wa-project-card--selected" : "",
        deleting ? "wa-project-card--deleting" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      onClick={handleCardActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardActivate();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={selectionMode ? selected : undefined}
      aria-label={
        selectionMode
          ? `${selected ? "Deselect" : "Select"} ${project.name}`
          : `Open ${project.name}`
      }
    >
      <div className="wa-project-card-preview">
        {selectionMode && onToggleSelect && (
          <div
            className="wa-project-card-select"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <SelectCheckbox
              checked={selected}
              disabled={deleting}
              label={`Select ${project.name}`}
              onChange={onToggleSelect}
            />
          </div>
        )}
        <div className="wa-project-card-mockup">
          <div className="wa-mockup-bar">
            <span />
            <span />
            <span />
          </div>
          <div className="wa-mockup-body">
            <div className="wa-mockup-line w-2/3" />
            <div className="wa-mockup-line w-full" />
            <div className="wa-mockup-grid">
              <span />
              <span />
              <span />
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
          <span>
            {project.versions.length} version{project.versions.length !== 1 ? "s" : ""}
          </span>
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
          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!deleting) onDelete();
                }}
                disabled={deleting}
                aria-label={`Delete ${project.name}`}
                className="wa-btn-ghost text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
            {!selectionMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
                className="wa-btn-ghost text-xs"
              >
                Open
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            )}
            {selectionMode && (
              <span className="text-xs font-medium text-brand-green">
                {selected ? "Selected" : "Tap to select"}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
