"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CAMPAIGN_LEADS,
  OPENAI_CONVERSATION,
  WORKER_DEMO,
  type WorkerPhase,
} from "@/lib/call-agent-data";
import { ROUTES } from "@/lib/constants";
import { BotIcon, CheckCircleIcon, PlayIcon } from "@/components/icons";

const PHASE_CONFIG: Record<WorkerPhase, { label: string; description: string }> = {
  idle: { label: "Ready", description: "Campaign loaded — press Start to begin outbound calling" },
  "picking-lead": { label: "Picking Lead", description: "Worker fetching next contact from campaign queue" },
  connecting: { label: "Connecting", description: "Initiating call and connecting OpenAI Realtime session" },
  "openai-conversation": { label: "OpenAI Conversation", description: "AI agent handling live conversation with customer" },
  "generating-report": { label: "Generating Report", description: "Saving transcript, AI summary, and call details" },
  "next-lead": { label: "Next Lead", description: "Moving to next contact in queue" },
};

const PHASE_ORDER: WorkerPhase[] = [
  "idle",
  "picking-lead",
  "connecting",
  "openai-conversation",
  "generating-report",
  "next-lead",
];

function getNextPhase(current: WorkerPhase): WorkerPhase {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) return "picking-lead";
  return PHASE_ORDER[idx + 1];
}

export function WorkerView() {
  const [phase, setPhase] = useState<WorkerPhase>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState(0);
  const [completedCalls, setCompletedCalls] = useState(4);
  const [currentLeadIdx, setCurrentLeadIdx] = useState(WORKER_DEMO.currentLeadIndex);
  const [lastReport, setLastReport] = useState<string | null>(null);

  const currentLead = CAMPAIGN_LEADS[currentLeadIdx] ?? CAMPAIGN_LEADS[0];
  const phaseInfo = PHASE_CONFIG[phase];
  const allDone = completedCalls >= CAMPAIGN_LEADS.length;

  const advancePhase = useCallback(() => {
    setPhase((prev) => {
      const next = getNextPhase(prev);
      if (next === "openai-conversation") setTranscriptLines(0);
      if (next === "generating-report") {
        setLastReport(null);
      }
      if (next === "next-lead") {
        setCompletedCalls((c) => c + 1);
        setCurrentLeadIdx((i) => Math.min(i + 1, CAMPAIGN_LEADS.length - 1));
        setLastReport(
          `Call report saved for ${currentLead.name} — ${currentLead.company}. AI summary generated. Follow-up: Demo scheduled.`
        );
      }
      if (next === "picking-lead" && prev === "next-lead") {
        setTranscriptLines(0);
      }
      return next;
    });
  }, [currentLead.name, currentLead.company]);

  useEffect(() => {
    if (!isRunning || phase === "idle" || allDone) return;

    const delays: Partial<Record<WorkerPhase, number>> = {
      "picking-lead": 1500,
      connecting: 1200,
      "openai-conversation": 4000,
      "generating-report": 2000,
      "next-lead": 1500,
    };

    const delay = delays[phase];
    if (!delay) return;

    const timer = setTimeout(advancePhase, delay);
    return () => clearTimeout(timer);
  }, [isRunning, phase, advancePhase, allDone]);

  useEffect(() => {
    if (phase !== "openai-conversation" || !isRunning) return;

    const interval = setInterval(() => {
      setTranscriptLines((n) => Math.min(n + 1, OPENAI_CONVERSATION.length));
    }, 800);

    return () => clearInterval(interval);
  }, [phase, isRunning]);

  const handleStart = () => {
    if (allDone) return;
    setIsRunning(true);
    setPhase("picking-lead");
    setLastReport(null);
  };

  const handleStop = () => {
    setIsRunning(false);
    setPhase("idle");
    setTranscriptLines(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="m-0 text-lg font-bold tracking-tight text-defaulttextcolor">Live Campaign Worker</h2>
          <p className="m-0 mt-1 text-sm text-textmuted">
            Automated outbound calling — picks leads, connects OpenAI, and saves reports
          </p>
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={allDone}
              className="ti-btn ti-btn-primary-full ti-btn-sm gap-1.5 disabled:opacity-50"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              {allDone ? "All Leads Contacted" : "Start Campaign"}
            </button>
          ) : (
            <button type="button" onClick={handleStop} className="ti-btn ti-btn-danger ti-btn-sm">
              Stop Worker
            </button>
          )}
          <Link href={`${ROUTES.callAgent}?tab=history`} className="ti-btn ti-btn-light ti-btn-sm no-underline">
            View Reports
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-4 flex flex-col gap-4">
          <div className="box">
            <div className="box-header">
              <h2 className="box-title">Active Campaign</h2>
              <span
                className={`badge gap-1.5 ${
                  isRunning ? "bg-emerald-50 text-emerald-700" : "bg-light text-textmuted"
                }`}
              >
                {isRunning && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
                {isRunning ? "Running" : "Stopped"}
              </span>
            </div>
            <div className="box-body space-y-4">
              {[
                { label: "Campaign", value: WORKER_DEMO.campaignName },
                { label: "Agent", value: WORKER_DEMO.agentName },
                { label: "OpenAI Model", value: WORKER_DEMO.model },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-textmuted">{item.label}</span>
                  <span className="font-semibold text-defaulttextcolor">{item.value}</span>
                </div>
              ))}

              <div className="border-t border-defaultborder/50 pt-4">
                <div className="mb-2 flex justify-between text-xs text-textmuted">
                  <span>{completedCalls} / {CAMPAIGN_LEADS.length} leads processed</span>
                  <span className="font-semibold">
                    {Math.round((completedCalls / CAMPAIGN_LEADS.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-light">
                  <div
                    className="h-full rounded-full bg-brand-green transition-all duration-500"
                    style={{ width: `${(completedCalls / CAMPAIGN_LEADS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="box">
            <div className="box-header">
              <h2 className="box-title">Worker Status</h2>
            </div>
            <div className="box-body">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isRunning ? "bg-brand-green/10 text-brand-green" : "bg-light text-textmuted"
                  }`}
                >
                  <BotIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="m-0 text-sm font-semibold text-defaulttextcolor">{phaseInfo.label}</p>
                  <p className="m-0 text-xs text-textmuted">{phaseInfo.description}</p>
                </div>
              </div>

              {lastReport && phase === "next-lead" && (
                <div className="mt-4 rounded-xl border border-brand-green/20 bg-brand-green/5 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-brand-green" />
                    <p className="m-0 text-sm font-semibold text-defaulttextcolor">Report Saved</p>
                  </div>
                  <p className="m-0 text-xs text-textmuted">{lastReport}</p>
                </div>
              )}
            </div>
          </div>

          <div className="box">
            <div className="box-header">
              <h2 className="box-title">Lead Queue</h2>
            </div>
            <div className="box-body space-y-2 p-0">
              {CAMPAIGN_LEADS.map((lead, idx) => (
                <div
                  key={lead.id}
                  className={`flex items-center justify-between border-b border-defaultborder/40 px-5 py-3 last:border-0 ${
                    idx === currentLeadIdx && isRunning
                      ? "bg-brand-green/5"
                      : idx < completedCalls
                        ? "opacity-60"
                        : ""
                  }`}
                >
                  <div>
                    <p className="m-0 text-sm font-semibold text-defaulttextcolor">{lead.name}</p>
                    <p className="m-0 text-xs text-textmuted">{lead.company}</p>
                  </div>
                  <span
                    className={`badge text-[0.65rem] ${
                      idx === currentLeadIdx && isRunning
                        ? "bg-blue-50 text-blue-700"
                        : lead.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : lead.status === "pending"
                            ? "bg-light text-textmuted"
                            : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {idx === currentLeadIdx && isRunning ? "Active" : lead.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-8">
          <div className="box">
            <div className="box-header">
              <h2 className="box-title">Current Lead</h2>
              {phase !== "idle" && (
                <span className="font-mono text-xs text-textmuted">{currentLead.id}</span>
              )}
            </div>
            <div className="box-body">
              {phase === "idle" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green/10">
                    <PlayIcon className="h-7 w-7 text-brand-green" />
                  </div>
                  <p className="m-0 mb-1 text-base font-semibold text-defaulttextcolor">Worker idle</p>
                  <p className="m-0 max-w-md text-sm text-textmuted">
                    Start the campaign to begin automated outbound calling. The worker will pick leads one at a time,
                    connect OpenAI, and save call reports after each conversation.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10 text-lg font-bold text-brand-green">
                      {currentLead.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="m-0 text-lg font-semibold text-defaulttextcolor">{currentLead.name}</p>
                      <p className="m-0 text-sm text-textmuted">
                        {currentLead.company} · {currentLead.phone}
                      </p>
                    </div>
                    {(phase === "connecting" || phase === "openai-conversation") && (
                      <span className="badge ml-auto gap-1.5 bg-emerald-50 text-emerald-700">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Live
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Phase", value: phaseInfo.label },
                      { label: "Model", value: "GPT-4o Realtime" },
                      { label: "Direction", value: "Outbound" },
                      { label: "Recording", value: phase === "openai-conversation" ? "On" : "—" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-defaultborder/50 bg-light/80 p-3">
                        <p className="m-0 text-[0.65rem] uppercase tracking-wide text-textmuted">{item.label}</p>
                        <p className="m-0 text-sm font-semibold text-defaulttextcolor">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(phase === "openai-conversation" ||
            phase === "generating-report" ||
            phase === "next-lead") && (
            <div className="box">
              <div className="box-header">
                <h2 className="box-title">OpenAI Live Transcript</h2>
                <span className="badge bg-violet-50 text-violet-700">Powered by OpenAI</span>
              </div>
              <div className="box-body">
                <div className="max-h-72 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                  {OPENAI_CONVERSATION.slice(0, transcriptLines).map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.speaker === "agent" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.speaker === "agent"
                            ? "rounded-bl-md bg-light text-defaulttextcolor"
                            : "rounded-br-md bg-brand-green/10 text-defaulttextcolor"
                        }`}
                      >
                        <span className="mb-0.5 block text-[0.65rem] font-semibold capitalize text-textmuted">
                          {msg.speaker === "agent" ? "AI Agent (OpenAI)" : "Customer"}
                        </span>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {phase === "openai-conversation" && transcriptLines < OPENAI_CONVERSATION.length && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md bg-light px-4 py-2.5">
                        <span className="inline-flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-textmuted/40 [animation-delay:0ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-textmuted/40 [animation-delay:150ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-textmuted/40 [animation-delay:300ms]" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {phase === "generating-report" && (
            <div className="box border-brand-green/30">
              <div className="box-body">
                <div className="flex items-center gap-4 py-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-green/20 border-t-brand-green" />
                  <div>
                    <p className="m-0 text-sm font-semibold text-defaulttextcolor">Generating call report…</p>
                    <p className="m-0 text-xs text-textmuted">
                      Saving transcript, AI summary, call status, recording link, and follow-up details
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
