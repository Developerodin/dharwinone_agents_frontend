"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import type { CallAgentTab } from "@/lib/constants";
import { CALL_AGENT_TABS, ROUTES } from "@/lib/constants";
import { CallAgentNav } from "./call-agent-nav";
import { DialerView } from "./views/dialer-view";
import { TrackHistoryView } from "./views/track-history-view";
import { CampaignsView } from "./views/campaigns-view";
import { AgentsView } from "./views/agents-view";
import { AnalyticsView } from "./views/analytics-view";
import { WorkerView } from "./views/worker-view";

function isValidTab(tab: string | null): tab is CallAgentTab {
  return CALL_AGENT_TABS.some((item) => item.id === tab);
}

function CallAgentWorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const created = searchParams.get("created") === "1";
  const leads = searchParams.get("leads") === "1";

  const [activeTab, setActiveTab] = useState<CallAgentTab>(
    isValidTab(tabParam) ? tabParam : "dialer"
  );

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = useCallback(
    (tab: CallAgentTab) => {
      setActiveTab(tab);
      router.replace(`${ROUTES.callAgent}?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  const successMessage =
    created && activeTab === "campaigns"
      ? "Campaign created successfully."
      : created && activeTab === "agents"
        ? "Agent created successfully."
        : leads && activeTab === "campaigns"
          ? "Lead list uploaded successfully."
          : null;

  return (
    <div className="space-y-5">
      <CallAgentNav tabs={CALL_AGENT_TABS} activeTab={activeTab} onTabChange={handleTabChange} />

      {successMessage && (
        <div className="rounded-xl border border-brand-green/20 bg-brand-green/8 px-4 py-3 text-sm text-brand-green">
          {successMessage}
        </div>
      )}

      <div className="min-h-[520px]">
        {activeTab === "dialer" && <DialerView />}
        {activeTab === "agents" && <AgentsView />}
        {activeTab === "campaigns" && <CampaignsView />}
        {activeTab === "worker" && <WorkerView />}
        {activeTab === "history" && <TrackHistoryView />}
        {activeTab === "analytics" && <AnalyticsView />}
      </div>
    </div>
  );
}

export function CallAgentWorkspace() {
  return (
    <Suspense fallback={<div className="min-h-[520px]" />}>
      <CallAgentWorkspaceInner />
    </Suspense>
  );
}
