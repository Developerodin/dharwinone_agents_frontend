"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/lib/constants";
import { useWebAgent } from "@/components/web-agent/web-agent-context";
import { SidebarTooltip } from "./ui/sidebar-tooltip";
import {
  ChevronRightIcon,
  FolderIcon,
  GlobeIcon,
  RocketIcon,
  SparklesIcon,
} from "@/components/icons";

type WebAgentSidebarNavProps = {
  collapsed: boolean;
  onMobileClose: () => void;
};

export function WebAgentSidebarNav({ collapsed, onMobileClose }: WebAgentSidebarNavProps) {
  const pathname = usePathname();
  const isWebAgentActive = pathname.startsWith(ROUTES.webAgent);
  const [expanded, setExpanded] = useState(isWebAgentActive);

  const {
    pageView,
    activeProjectId,
    startNewProject,
    showMyProjects,
    showDeployProjects,
  } = useWebAgent();

  const isNew = pageView === "new" && !activeProjectId;
  const isMyProjects = pageView === "my-projects";
  const isDeployProjects = pageView === "deploy-projects";

  const handleNav = (action: () => void) => {
    action();
    onMobileClose();
  };

  if (collapsed) {
    return (
      <div className="sidebar-collapsed-stack">
        <SidebarTooltip label="Web Agent">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={`sidebar-icon-btn ${isWebAgentActive ? "sidebar-icon-btn-active" : ""}`}
            aria-expanded={expanded}
          >
            <GlobeIcon className="sidebar-nav-icon" />
          </button>
        </SidebarTooltip>

        {isWebAgentActive && (
          <div className="sidebar-collapsed-substack wa-animate-fade-in">
            <SidebarTooltip label="New project">
              <button
                type="button"
                onClick={() => handleNav(startNewProject)}
                className={`sidebar-icon-btn sidebar-icon-btn-sub ${isNew ? "sidebar-icon-btn-active" : ""}`}
              >
                <SparklesIcon className="h-4 w-4" />
              </button>
            </SidebarTooltip>
            <SidebarTooltip label="My Projects">
              <button
                type="button"
                onClick={() => handleNav(showMyProjects)}
                className={`sidebar-icon-btn sidebar-icon-btn-sub ${isMyProjects ? "sidebar-icon-btn-active" : ""}`}
              >
                <FolderIcon className="h-4 w-4" />
              </button>
            </SidebarTooltip>
            <SidebarTooltip label="Deploy Projects">
              <button
                type="button"
                onClick={() => handleNav(showDeployProjects)}
                className={`sidebar-icon-btn sidebar-icon-btn-sub ${isDeployProjects ? "sidebar-icon-btn-active" : ""}`}
              >
                <RocketIcon className="h-4 w-4" />
              </button>
            </SidebarTooltip>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`sidebar-nav-item sidebar-nav-item-expanded w-full ${
          isWebAgentActive ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive"
        }`}
      >
        <GlobeIcon className="sidebar-nav-icon" />
        <span className="flex-1 truncate text-left">Web Agent</span>
        <ChevronRightIcon
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="wa-sidebar-subnav ml-3 space-y-0.5 border-l-2 border-brand-green/15 pl-2.5">
          <button
            type="button"
            onClick={() => handleNav(startNewProject)}
            className={`wa-sidebar-subitem w-full ${isNew ? "wa-sidebar-subitem-active" : ""}`}
          >
            <SparklesIcon className="h-3.5 w-3.5 shrink-0" />
            <span>New project</span>
          </button>
          <button
            type="button"
            onClick={() => handleNav(showMyProjects)}
            className={`wa-sidebar-subitem w-full ${isMyProjects ? "wa-sidebar-subitem-active" : ""}`}
          >
            <FolderIcon className="h-3.5 w-3.5 shrink-0" />
            <span>My Projects</span>
          </button>
          <button
            type="button"
            onClick={() => handleNav(showDeployProjects)}
            className={`wa-sidebar-subitem w-full ${isDeployProjects ? "wa-sidebar-subitem-active" : ""}`}
          >
            <RocketIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Deploy Projects</span>
          </button>
        </div>
      )}
    </div>
  );
}
