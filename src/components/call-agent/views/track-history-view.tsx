"use client";

import { useEffect, useState } from "react";
import { useCallRecords } from "@/hooks/use-call-records";
import { fetchRecordingBlobUrl, type TelephonyCallRecord } from "@/lib/telephony-api";
import { FilterIcon, DownloadIcon } from "@/components/icons";

type UiStatus = "completed" | "in-progress" | "failed" | "no-answer";

const STATUS_STYLES: Record<UiStatus, string> = {
  completed: "status-completed",
  "in-progress": "status-in-progress",
  failed: "status-failed",
  "no-answer": "status-no-answer",
};

const STATUS_LABELS: Record<UiStatus, string> = {
  completed: "Completed",
  "in-progress": "In Progress",
  failed: "Failed",
  "no-answer": "No Answer",
};

export function toUiStatus(status: string): UiStatus {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "completed";
  if (s === "no_answer") return "no-answer";
  if (s === "failed" || s === "busy" || s === "call_disconnected" || s === "expired") return "failed";
  return "in-progress"; // initiated, ringing, in_progress, unknown
}

export function formatDuration(seconds?: number): string {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export function TrackHistoryView() {
  const { records, error } = useCallRecords();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<{ id: string; url: string } | null>(null);

  // Derived, no effect: newest call is selected until the user picks one.
  const effectiveId = selectedId ?? records?.[0]?.executionId ?? null;
  const selected: TelephonyCallRecord | undefined =
    records?.find((r) => r.executionId === effectiveId) ?? records?.[0];
  const recordingSrc =
    selected?.executionId && recordingState?.id === selected.executionId ? recordingState.url : null;

  useEffect(() => {
    if (!selected?.recordingUrl || !selected?.executionId) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    fetchRecordingBlobUrl(selected.executionId)
      .then((url) => {
        objectUrl = url;
        if (!cancelled) setRecordingState({ id: selected.executionId, url });
      })
      .catch(() => {
        if (!cancelled) setRecordingState(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selected?.executionId, selected?.recordingUrl]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="m-0 text-lg font-bold tracking-tight text-defaulttextcolor">Call Reports</h2>
        <p className="m-0 mt-1 text-sm text-textmuted">
          Live call records from the dialer — status, duration, and recordings
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load call records: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className="box">
            <div className="box-header">
              <div>
                <h2 className="box-title">All Calls</h2>
                <p className="box-subtitle">Recorded automatically for every dialer call</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="ti-btn ti-btn-sm ti-btn-light gap-1.5">
                  <FilterIcon className="w-3.5 h-3.5" />
                  Filter
                </button>
              </div>
            </div>
            <div className="box-body p-0">
              {records === null && !error ? (
                <p className="m-0 px-5 py-10 text-center text-sm text-textmuted">Loading call records…</p>
              ) : records?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-defaultborder/60 bg-light/60 text-textmuted">
                        <th className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide">Number</th>
                        <th className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide">Direction</th>
                        <th className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide">Status</th>
                        <th className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide">Duration</th>
                        <th className="hidden px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wide md:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((call) => {
                        const ui = toUiStatus(call.status);
                        return (
                          <tr
                            key={call.executionId}
                            onClick={() => setSelectedId(call.executionId)}
                            className={`cursor-pointer border-b border-defaultborder/40 transition-colors last:border-0 ${
                              effectiveId === call.executionId ? "bg-brand-green/5" : "hover:bg-light/50"
                            }`}
                          >
                            <td className="px-5 py-4">
                              <p className="m-0 font-semibold text-defaulttextcolor">{call.toPhoneNumber ?? "Unknown"}</p>
                              <p className="m-0 mt-0.5 font-mono text-xs text-textmuted">{call.executionId.slice(0, 12)}…</p>
                            </td>
                            <td className="px-5 py-4 text-xs capitalize text-defaulttextcolor">
                              {call.telephonyData?.direction ?? "outbound"}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`badge ${STATUS_STYLES[ui]}`}>{STATUS_LABELS[ui]}</span>
                            </td>
                            <td className="px-5 py-4 font-mono text-xs text-textmuted">{formatDuration(call.duration)}</td>
                            <td className="hidden px-5 py-4 text-xs text-defaulttextcolor md:table-cell">
                              {formatDate(call.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="m-0 px-5 py-10 text-center text-sm text-textmuted">
                  No calls yet — place one from the Dialer tab.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="box xl:sticky xl:top-[88px]">
            <div className="box-header">
              <h2 className="box-title">Call Detail</h2>
              <span className="font-mono text-xs text-textmuted">{selected?.executionId ?? "—"}</span>
            </div>
            <div className="box-body space-y-5">
              {!selected ? (
                <p className="m-0 py-8 text-center text-sm text-textmuted">Select a call to see its details.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "To", value: selected.toPhoneNumber ?? "—" },
                      { label: "From", value: selected.fromPhoneNumber ?? "—" },
                      { label: "Status", value: STATUS_LABELS[toUiStatus(selected.status)] },
                      { label: "Duration", value: formatDuration(selected.duration) },
                      { label: "Date", value: formatDate(selected.createdAt) },
                      { label: "Recording", value: selected.recordingUrl ? "Available" : "—" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-defaultborder/50 bg-light/80 p-3">
                        <p className="m-0 mb-0.5 text-[0.65rem] uppercase tracking-wide text-textmuted">{item.label}</p>
                        <p className="m-0 break-words text-sm font-semibold text-defaulttextcolor">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {selected.notes ? (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-defaulttextcolor">Notes</p>
                      <p className="m-0 rounded-xl border border-defaultborder/50 bg-light p-3.5 text-sm text-textmuted">
                        {selected.notes}
                      </p>
                    </div>
                  ) : null}

                  {selected.recordingUrl && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-defaulttextcolor">Recording</p>
                      {/* Streams through the sidecar proxy — Twilio creds never reach the browser. */}
                      {recordingSrc ? (
                        <>
                          <audio controls preload="none" className="w-full" src={recordingSrc} />
                          <a
                            href={recordingSrc}
                            download={`${selected.executionId}.mp3`}
                            className="ti-btn ti-btn-light mt-2 w-full gap-2"
                          >
                            <DownloadIcon className="h-4 w-4" />
                            Download Recording
                          </a>
                        </>
                      ) : (
                        <p className="m-0 text-sm text-textmuted">Loading recording…</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
