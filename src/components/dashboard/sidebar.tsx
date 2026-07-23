"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { BrandLogo } from "@/components/brand/brand-logo";
import { WebAgentSidebarNav } from "@/components/web-agent/web-agent-sidebar-nav";
import { SidebarTooltip } from "@/components/web-agent/ui/sidebar-tooltip";
import { PhoneCallIcon, ChevronLeftIcon, LogOutIcon } from "@/components/icons";
import { getUser } from "@/lib/auth";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSignOut: () => void;
};

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  onSignOut,
}: SidebarProps) {
  const pathname = usePathname();
  const isCallAgentActive = pathname.startsWith(ROUTES.callAgent);
  const user = getUser();
  const userName = user?.name?.trim() || "User";
  const userSubtitle = user?.email?.trim() || "Account";
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`sidebar-shell fixed top-0 left-0 z-50 flex h-full flex-col overflow-hidden border-r border-[var(--sidebar-border)] transition-[width,transform] duration-300 ease-in-out ${
          collapsed ? "w-[72px]" : "w-[260px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Brand row */}
        <div
          className={`sidebar-brand shrink-0 border-b border-[var(--sidebar-border)] ${
            collapsed ? "sidebar-brand-collapsed" : "sidebar-brand-expanded"
          }`}
        >
          <div className={collapsed ? "sidebar-brand-group" : "min-w-0"}>
            <BrandLogo
              href={ROUTES.callAgent}
              compact
              showText={!collapsed}
            />
          </div>

          <button
            type="button"
            onClick={onToggle}
            className={`sidebar-toggle-btn ${collapsed ? "sidebar-toggle-btn-collapsed" : ""}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeftIcon
              className={`transition-transform duration-300 ${
                collapsed ? "h-3.5 w-3.5 rotate-180" : "h-4 w-4"
              }`}
            />
          </button>
        </div>

        <nav
          className={`sidebar-nav flex min-h-0 flex-1 flex-col ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          {/* Profile */}
          <div className={`sidebar-profile ${collapsed ? "sidebar-profile-collapsed" : ""}`}>
            <div
              className="sidebar-avatar"
              title={collapsed ? userName : undefined}
            >
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-semibold leading-tight text-[#111827]">
                  {userName}
                </p>
                <p className="m-0 mt-0.5 truncate text-xs text-textmuted">{userSubtitle}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className={`flex-1 ${collapsed ? "sidebar-collapsed-stack" : "space-y-1"}`}>
            {collapsed ? (
              <SidebarTooltip label="Call Agent">
                <Link
                  href={ROUTES.callAgent}
                  onClick={onMobileClose}
                  aria-current={isCallAgentActive ? "page" : undefined}
                  className={`sidebar-icon-btn ${isCallAgentActive ? "sidebar-icon-btn-active" : ""}`}
                >
                  <PhoneCallIcon className="sidebar-nav-icon" />
                </Link>
              </SidebarTooltip>
            ) : (
              <Link
                href={ROUTES.callAgent}
                onClick={onMobileClose}
                aria-current={isCallAgentActive ? "page" : undefined}
                className={`sidebar-nav-item sidebar-nav-item-expanded ${
                  isCallAgentActive ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive"
                }`}
              >
                <PhoneCallIcon className="sidebar-nav-icon" />
                <span className="truncate">Call Agent</span>
                <span className="sidebar-nav-badge">3</span>
              </Link>
            )}
            {/* ponytail: Website Builder nav hidden until it ships. Restore this block to re-enable. */}
            <WebAgentSidebarNav collapsed={collapsed} onMobileClose={onMobileClose} />
          </div>

          {/* Sign out */}
          <div className="sidebar-footer">
            {collapsed ? (
              <SidebarTooltip label="Sign out">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="sidebar-icon-btn sidebar-icon-btn-danger"
                >
                  <LogOutIcon className="sidebar-nav-icon" />
                </button>
              </SidebarTooltip>
            ) : (
              <button
                type="button"
                onClick={onSignOut}
                className="sidebar-signout-btn sidebar-signout-btn-expanded"
              >
                <LogOutIcon className="sidebar-nav-icon" />
                <span className="truncate">Sign out</span>
              </button>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
