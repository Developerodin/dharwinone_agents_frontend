"use client";

import type { CallAgentTab } from "@/lib/constants";
import {
  HistoryIcon,
  MegaphoneIcon,
  BotIcon,
  AnalyticsIcon,
  SettingsIcon,
  PhoneCallIcon,
} from "@/components/icons";

const TAB_ICONS: Record<CallAgentTab, React.ComponentType<{ className?: string }>> = {
  dialer: PhoneCallIcon,
  agents: BotIcon,
  campaigns: MegaphoneIcon,
  worker: SettingsIcon,
  history: HistoryIcon,
  analytics: AnalyticsIcon,
};

type CallAgentNavProps = {
  tabs: { id: CallAgentTab; label: string }[];
  activeTab: CallAgentTab;
  onTabChange: (tab: CallAgentTab) => void;
};

export function CallAgentNav({ tabs, activeTab, onTabChange }: CallAgentNavProps) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-defaultborder/60 custom-scrollbar"
      role="tablist"
      aria-label="Call agent sections"
    >
      {tabs.map((tab) => {
        const Icon = TAB_ICONS[tab.id];
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-brand-green text-brand-green"
                : "border-transparent text-textmuted hover:border-defaultborder hover:text-defaulttextcolor"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
