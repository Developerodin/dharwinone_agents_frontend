"use client";

import { useEffect, useMemo, useState } from "react";
import type { WebProject } from "@/lib/web-agent-data";
import {
  buildProjectFileTree,
  buildProjectFiles,
  getDefaultExpandedFolders,
  getLanguageFromPath,
  type FileTreeNode,
} from "@/lib/project-file-tree";
import { CodeSkeleton } from "./skeleton-loaders";
import { ChevronRightIcon, CopyIcon, FolderIcon } from "@/components/icons";

type CodeExplorerProps = {
  project: WebProject;
  html: string;
  css: string;
  js: string;
  loading?: boolean;
};

export function CodeExplorer({ project, html, css, js, loading }: CodeExplorerProps) {
  const tree = useMemo(() => buildProjectFileTree(project, html, css, js), [project, html, css, js]);
  const files = useMemo(() => buildProjectFiles(project, html, css, js), [project, html, css, js]);
  const [expanded, setExpanded] = useState<Set<string>>(getDefaultExpandedFolders);
  const [selectedPath, setSelectedPath] = useState("pages/index.html");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);

  const fileContent = files[selectedPath] ?? `// File: ${selectedPath}\n// Content not available`;

  useEffect(() => {
    if (!isEditing) setEditedContent(fileContent);
  }, [fileContent, isEditing, selectedPath]);

  const toggleFolder = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(isEditing ? editedContent : fileContent);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const lang = getLanguageFromPath(selectedPath);

  return (
    <div className="flex h-full bg-[#0d1117]">
      {/* File tree sidebar */}
      <div className="wa-code-explorer-tree flex w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-[#161b22]">
        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
          <FolderIcon className="h-3.5 w-3.5 text-brand-green" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Explorer</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              expanded={expanded}
              selectedPath={selectedPath}
              onToggle={toggleFolder}
              onSelect={setSelectedPath}
            />
          ))}
        </div>
      </div>

      {/* Editor pane */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#161b22] px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-mono text-xs text-slate-300">{selectedPath}</span>
            <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[0.625rem] font-medium uppercase text-slate-500">
              {lang}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              className="rounded-md px-2.5 py-1 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {isEditing ? "View" : "Edit"}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <CopyIcon className="h-3.5 w-3.5" />
              {copyFeedback ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <CodeSkeleton />
          ) : isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="h-full min-h-[400px] w-full resize-none border-0 bg-transparent p-5 font-mono text-[0.8125rem] leading-relaxed text-[#e6edf3] outline-none"
              spellCheck={false}
            />
          ) : (
            <pre className="m-0 p-5 font-mono text-[0.8125rem] leading-relaxed text-[#e6edf3] wa-animate-fade-in">
              <code>{fileContent}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  expanded,
  selectedPath,
  onToggle,
  onSelect,
}: {
  node: FileTreeNode;
  depth: number;
  expanded: Set<string>;
  selectedPath: string;
  onToggle: (id: string) => void;
  onSelect: (path: string) => void;
}) {
  const isFolder = node.type === "folder";
  const isOpen = expanded.has(node.id);
  const isSelected = !isFolder && node.path === selectedPath;

  const handleClick = () => {
    if (isFolder) onToggle(node.id);
    else onSelect(node.path);
  };

  const fileIcon = isFolder ? (
    <FolderIcon className={`h-3.5 w-3.5 shrink-0 ${isOpen ? "text-brand-green" : "text-slate-500"}`} />
  ) : (
    <FileIcon path={node.path} selected={isSelected} />
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`wa-tree-node flex w-full items-center gap-1.5 py-1 pr-2 text-left transition-colors duration-150 ${
          isSelected ? "bg-brand-green/15 text-brand-green" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
        }`}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        {isFolder && (
          <ChevronRightIcon
            className={`h-3 w-3 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90 text-brand-green" : ""}`}
          />
        )}
        {!isFolder && <span className="w-3 shrink-0" />}
        {fileIcon}
        <span className="truncate text-xs font-medium">{node.name}</span>
      </button>
      {isFolder && isOpen && node.children?.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          selectedPath={selectedPath}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

function FileIcon({ path, selected }: { path: string; selected: boolean }) {
  const ext = path.split(".").pop() ?? "";
  const colors: Record<string, string> = {
    tsx: "text-blue-400",
    ts: "text-blue-400",
    css: "text-pink-400",
    html: "text-orange-400",
    json: "text-yellow-400",
    md: "text-slate-300",
    js: "text-yellow-300",
    svg: "text-purple-400",
    ico: "text-slate-500",
    jpg: "text-emerald-400",
    png: "text-emerald-400",
  };
  return (
    <span className={`text-[0.625rem] font-bold uppercase ${selected ? "text-brand-green" : colors[ext] ?? "text-slate-500"}`}>
      {ext.slice(0, 3)}
    </span>
  );
}
