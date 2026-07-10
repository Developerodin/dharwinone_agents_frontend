"use client";

import {
  MenuIcon,
  BellIcon,
  SearchIcon,
  BriefcaseIcon,
} from "@/components/icons";
import { getUser } from "@/lib/auth";

type HeaderProps = {
  sidebarCollapsed: boolean;
  onMobileMenuOpen: () => void;
};

export function Header({ sidebarCollapsed, onMobileMenuOpen }: HeaderProps) {
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
    <header
      className={`fixed top-0 right-0 left-0 z-30 h-[64px] bg-white border-b border-[var(--header-border)] transition-[padding] duration-300 ${
        sidebarCollapsed ? "lg:ps-[72px]" : "lg:ps-[260px]"
      }`}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6 gap-4">
        
        {/* LEFT SECTION */}
        <div className="flex items-center gap-3 flex-1">
          <button
            type="button"
            onClick={onMobileMenuOpen}
            className="lg:hidden header-icon-btn shrink-0"
            aria-label="Open menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="header-search flex items-center gap-2 w-full max-w-xl">
            <SearchIcon className="w-4 h-4 text-textmuted shrink-0" />
            <input
              type="search"
              placeholder="Search calls, campaigns, contacts..."
              className="bg-transparent border-0 outline-none text-sm w-full text-defaulttextcolor placeholder:text-textmuted"
            />
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2 shrink-0">
          
          <button
            type="button"
            className="header-icon-btn hidden sm:flex"
            aria-label="Campaigns"
          >
            <BriefcaseIcon className="w-[1.125rem] h-[1.125rem]" />
          </button>

          <button
            type="button"
            className="header-icon-btn relative"
            aria-label="Notifications"
          >
            <BellIcon className="w-[1.125rem] h-[1.125rem]" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-green ring-2 ring-white" />
          </button>

          {/* Profile */}
          <div className="hidden sm:flex items-center gap-2.5 ps-2 ms-1 border-s border-defaultborder/70">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E0F2FE] to-[#DBEAFE] text-brand-navy flex items-center justify-center font-semibold text-sm ring-2 ring-white shadow-sm">
              {initials}
            </div>

            <div className="hidden md:block min-w-0">
              <p className="text-sm font-medium text-[#111827] leading-tight truncate">
                {userName}
              </p>
              <p className="text-[0.6875rem] text-textmuted">
                {userSubtitle}
              </p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}