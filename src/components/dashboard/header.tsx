"use client";

import { useEffect, useRef, useState } from "react";
import {
  MenuIcon,
  BellIcon,
  SearchIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  LogOutIcon,
} from "@/components/icons";
import { getUser } from "@/lib/auth";
import { useTokenBalance } from "@/hooks/use-token-balance";

type HeaderProps = {
  sidebarCollapsed: boolean;
  onMobileMenuOpen: () => void;
  onSignOut: () => void;
};

export function Header({ sidebarCollapsed, onMobileMenuOpen, onSignOut }: HeaderProps) {
  const user = getUser();
  const { balance } = useTokenBalance();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const userName = user?.name?.trim() || "User";
  const userSubtitle = user?.email?.trim() || "Account";
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (profileRef.current?.contains(event.target as Node)) return;
      setProfileOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileOpen]);

  const handleSignOut = () => {
    setProfileOpen(false);
    onSignOut();
  };

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

          {balance !== null ? (
            <span
              className="hidden sm:inline-flex items-center rounded-full border border-defaultborder/70 bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#334155]"
              title="Token balance"
            >
              {balance} tokens
            </span>
          ) : null}
          
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
          <div ref={profileRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2.5 ps-2 ms-1 border-s border-defaultborder/70 rounded-lg pe-1 py-1 hover:bg-[#F3F4F6] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E0F2FE] to-[#DBEAFE] text-brand-navy flex items-center justify-center font-semibold text-sm ring-2 ring-white shadow-sm">
                {initials}
              </div>

              <div className="hidden md:block min-w-0 text-left">
                <p className="text-sm font-medium text-[#111827] leading-tight truncate">
                  {userName}
                </p>
                <p className="text-[0.6875rem] text-textmuted truncate">
                  {userSubtitle}
                </p>
              </div>

              <ChevronDownIcon
                className={`hidden md:block w-4 h-4 text-textmuted shrink-0 transition-transform duration-200 ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen ? (
              <div
                role="menu"
                aria-label="Profile menu"
                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[12rem] overflow-hidden rounded-xl border border-defaultborder/70 bg-white py-1 shadow-lg"
              >
                <div className="border-b border-defaultborder/70 px-3 py-2 md:hidden">
                  <p className="text-sm font-medium text-[#111827] truncate">{userName}</p>
                  <p className="text-xs text-textmuted truncate">{userSubtitle}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                >
                  <LogOutIcon className="w-4 h-4 shrink-0" />
                  <span>Log out</span>
                </button>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </header>
  );
}
