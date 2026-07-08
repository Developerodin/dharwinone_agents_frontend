"use client";

import { useState } from "react";
import { CALL_HISTORY } from "@/lib/call-agent-data";
import type { CallStatus } from "@/lib/call-agent-data";
import { BotIcon, FilterIcon, DownloadIcon } from "@/components/icons";

const STATUS_STYLES: Record<CallStatus, string> = {
  completed: "status-completed",
  "in-progress": "status-in-progress",
  failed: "status-failed",
  "no-answer": "status-no-answer",
  scheduled: "status-scheduled",
};

const STATUS_LABELS: Record<CallStatus, string> = {
  completed: "Completed",
  "in-progress": "In Progress",
  failed: "Failed",
  "no-answer": "No Answer",
  scheduled: "Scheduled",
};

export function TrackHistoryView() {
  const [selectedId, setSelectedId] = useState(CALL_HISTORY[0].id);

  const selected = CALL_HISTORY.find((c) => c.id === selectedId) ?? CALL_HISTORY[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="m-0 text-lg font-bold tracking-tight text-defaulttextcolor">Call Reports</h2>
        <p className="m-0 mt-1 text-sm text-textmuted">
          AI-generated summaries, transcripts, and call details
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className="box">
            <div className="box-header">
              <div>
                <h2 className="box-title">All Reports</h2>
                <p className="box-subtitle">Generated automatically when each call ends</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="ti-btn ti-btn-sm ti-btn-light gap-1.5">
                  <FilterIcon className="w-3.5 h-3.5" />
                  Filter
                </button>
                <button type="button" className="ti-btn ti-btn-sm ti-btn-light gap-1.5">
                  <DownloadIcon className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>
            <div className="box-body p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-defaultborder/60 bg-light/60 text-textmuted">
                      <th className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide">Customer</th>
                      <th className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide">Campaign</th>
                      <th className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide">Duration</th>
                      <th className="hidden px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide md:table-cell">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CALL_HISTORY.map((call) => (
                      <tr
                        key={call.id}
                        onClick={() => setSelectedId(call.id)}
                        className={`cursor-pointer border-b border-defaultborder/40 transition-colors last:border-0 ${
                          selectedId === call.id ? "bg-brand-green/5" : "hover:bg-light/50"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <p className="m-0 font-semibold text-defaulttextcolor">{call.customer}</p>
                          <p className="m-0 mt-0.5 text-xs text-textmuted">{call.company}</p>
                        </td>
                        <td className="px-5 py-4 text-xs text-defaulttextcolor">{call.campaign}</td>
                        <td className="px-5 py-4">
                          <span className={`badge ${STATUS_STYLES[call.status]}`}>
                            {STATUS_LABELS[call.status]}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-textmuted">{call.duration}</td>
                        <td className="hidden max-w-[180px] truncate px-5 py-4 text-xs text-defaulttextcolor md:table-cell">
                          {call.outcome}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="box xl:sticky xl:top-[88px]">
            <div className="box-header">
              <h2 className="box-title">Call Report</h2>
              <span className="font-mono text-xs text-textmuted">{selected.id}</span>
            </div>
            <div className="box-body space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-sm font-bold text-brand-green">
                  {selected.customer.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="m-0 font-semibold text-defaulttextcolor">{selected.customer}</p>
                  <p className="m-0 text-sm text-textmuted">{selected.company}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Phone", value: selected.phone },
                  { label: "Campaign", value: selected.campaign },
                  { label: "Agent", value: selected.agent },
                  { label: "Duration", value: selected.duration },
                  { label: "Sentiment", value: selected.sentiment },
                  { label: "Date", value: selected.date },
                  { label: "Recording", value: selected.recordingUrl ? "Available" : "—" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-defaultborder/50 bg-light/80 p-3">
                    <p className="m-0 mb-0.5 text-[0.65rem] uppercase tracking-wide text-textmuted">{item.label}</p>
                    <p className="m-0 text-sm font-semibold text-defaulttextcolor">{item.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <BotIcon className="h-4 w-4 text-brand-green" />
                  <p className="m-0 text-sm font-semibold text-defaulttextcolor">AI Summary</p>
                </div>
                <p className="m-0 rounded-xl border border-brand-green/20 bg-brand-green/5 p-3.5 text-sm leading-relaxed text-defaulttextcolor">
                  {selected.aiSummary}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-defaulttextcolor">Outcome & Follow-up</p>
                <div className="space-y-2">
                  <p className="m-0 rounded-xl border border-defaultborder/50 bg-light p-3.5 text-sm text-textmuted">
                    <span className="font-semibold text-defaulttextcolor">Outcome: </span>
                    {selected.outcome}
                  </p>
                  <p className="m-0 rounded-xl border border-defaultborder/50 bg-light p-3.5 text-sm text-textmuted">
                    <span className="font-semibold text-defaulttextcolor">Follow-up: </span>
                    {selected.followUp}
                  </p>
                </div>
              </div>

              {selected.transcript.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-defaulttextcolor">Transcript</p>
                  <div className="max-h-52 space-y-2.5 overflow-y-auto custom-scrollbar pr-1">
                    {selected.transcript.map((msg, i) => (
                      <div key={i} className={`flex ${msg.speaker === "agent" ? "justify-start" : "justify-end"}`}>
                        <div
                          className={`max-w-[90%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                            msg.speaker === "agent"
                              ? "bg-light text-defaulttextcolor"
                              : "bg-brand-green/10 text-defaulttextcolor"
                          }`}
                        >
                          <span className="font-semibold capitalize text-textmuted">
                            {msg.speaker === "agent" ? "AI Agent (OpenAI)" : "Customer"}:{" "}
                          </span>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.recordingUrl && (
                <button type="button" className="ti-btn ti-btn-light w-full gap-2">
                  <DownloadIcon className="h-4 w-4" />
                  Download Recording
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
