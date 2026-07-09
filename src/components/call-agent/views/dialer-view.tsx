"use client";

import { useState } from "react";
import { DialPad } from "@/components/call-agent/dial-pad";
import { AGENTS } from "@/lib/call-agent-data";
import { useTwilioDialer } from "@/hooks/use-twilio-dialer";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  formatDisplayNumber,
  formatDomesticNumber,
  getCallTypeLabel,
  getCountryByCode,
  getFullNumber,
  getMaxDigits,
  isValidNumber,
  type CallType,
  type CountryOption,
} from "@/lib/phone-utils";
import { MicIcon, PhoneCallIcon } from "@/components/icons";

type CallState = "idle" | "connecting" | "active";

function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function DialerView() {
  const [callType, setCallType] = useState<CallType>("domestic");
  const [country, setCountry] = useState<CountryOption>(DEFAULT_COUNTRY);
  const [nationalDigits, setNationalDigits] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]?.id ?? "");
  const dialer = useTwilioDialer();

  const callState: CallState =
    dialer.status === "in-call" ? "active" : dialer.status === "connecting" ? "connecting" : "idle";

  const displayNumber = formatDisplayNumber(callType, nationalDigits, country);
  const digitCount = nationalDigits.replace(/\D/g, "").length;
  const canCall = isValidNumber(callType, nationalDigits, country) && dialer.status === "ready";
  const isInCall = callState === "connecting" || callState === "active";
  const agent = AGENTS.find((a) => a.id === selectedAgent) ?? AGENTS[0];

  const handleKeyPress = (key: string) => {
    if (isInCall) return;
    const maxLen = getMaxDigits(callType, country);
    setNationalDigits((prev) => {
      const next = prev.replace(/\D/g, "") + key;
      return next.slice(0, maxLen);
    });
  };

  const handleBackspace = () => {
    if (isInCall) return;
    setNationalDigits((prev) => prev.replace(/\D/g, "").slice(0, -1));
  };

  const handleCallTypeChange = (type: CallType) => {
    if (isInCall) return;
    setCallType(type);
    setNationalDigits("");
    setCountry(DEFAULT_COUNTRY);
  };

  const handleStartCall = () => {
    if (!canCall) return;
    void dialer.dial(`+${getFullNumber(callType, nationalDigits, country)}`);
  };

  const handleEndCall = () => {
    dialer.hangup();
  };

  const requiredDigits = `${country.minDigits}–${country.maxDigits}`;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="xl:col-span-5">
        <div className="box h-full">
          <div className="box-header">
            <div>
              <h2 className="box-title">Dial Pad</h2>
              <p className="box-subtitle">Place domestic or international calls manually</p>
            </div>
          </div>
          <div className="box-body space-y-5">
            <div className="flex rounded-xl border border-defaultborder/60 bg-light p-1">
              {(["domestic", "international"] as CallType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={isInCall}
                  onClick={() => handleCallTypeChange(type)}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold capitalize transition-all duration-200 disabled:opacity-50 ${
                    callType === type
                      ? "border border-defaultborder/50 bg-white text-brand-green shadow-sm"
                      : "text-textmuted hover:text-defaulttextcolor"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div>
              <label
                htmlFor="dialer-country"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-textmuted"
              >
                Country
              </label>
              <select
                id="dialer-country"
                value={country.code}
                disabled={isInCall || callType === "domestic"}
                onChange={(e) => {
                  const selected = getCountryByCode(e.target.value);
                  setCountry(selected);
                  setNationalDigits((prev) => prev.replace(/\D/g, "").slice(0, selected.maxDigits));
                }}
                className="h-11 w-full rounded-xl border border-defaultborder bg-white px-4 text-sm font-medium text-defaulttextcolor outline-none focus:border-brand-green disabled:cursor-default disabled:opacity-60"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.dialCode})
                  </option>
                ))}
              </select>
              {callType === "domestic" && (
                <p className="m-0 mt-1.5 text-xs text-textmuted">Domestic calls use India (+91) by default</p>
              )}
            </div>

            <div className="space-y-2 py-1 text-center">
              <div className="flex min-h-[44px] items-center justify-center gap-2">
                <span className="shrink-0 text-2xl font-semibold text-brand-green sm:text-3xl">
                  {country.dialCode}
                </span>
                <input
                  type="tel"
                  value={
                    callType === "domestic"
                      ? formatDomesticNumber(nationalDigits, country)
                      : nationalDigits.replace(/\D/g, "")
                  }
                  onChange={(e) => {
                    if (isInCall) return;
                    const maxLen = getMaxDigits(callType, country);
                    setNationalDigits(e.target.value.replace(/\D/g, "").slice(0, maxLen));
                  }}
                  placeholder={callType === "domestic" ? "98765 43210" : "Phone number"}
                  disabled={isInCall}
                  className="flex-1 border-0 bg-transparent text-center text-2xl font-semibold tracking-wide text-defaulttextcolor outline-none placeholder:text-textmuted/40 disabled:opacity-70 sm:text-3xl"
                />
              </div>

              {nationalDigits.length > 0 && (
                <p className="m-0 text-lg font-medium tracking-wide text-brand-green">{displayNumber.trim()}</p>
              )}

              <p className="m-0 text-xs text-textmuted">
                {digitCount > 0
                  ? `${digitCount} digit${digitCount !== 1 ? "s" : ""} · ${requiredDigits} required`
                  : callType === "domestic"
                    ? "India · enter 10-digit mobile number"
                    : `Enter ${country.minDigits}–${country.maxDigits} digits after ${country.dialCode}`}
              </p>
            </div>

            <div>
              <label
                htmlFor="dialer-agent"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-textmuted"
              >
                AI Agent
              </label>
              <select
                id="dialer-agent"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                disabled={isInCall}
                className="h-11 w-full rounded-xl border border-defaultborder bg-white px-4 text-sm font-medium text-defaulttextcolor outline-none focus:border-brand-green disabled:opacity-60"
              >
                {AGENTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.role}
                  </option>
                ))}
              </select>
            </div>

            <DialPad onKeyPress={handleKeyPress} onBackspace={handleBackspace} disabled={isInCall} />

            <div className="space-y-2 pt-1">
              {dialer.error && (
                <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  <span className="min-w-0 truncate">{dialer.error}</span>
                  <button type="button" onClick={dialer.retry} className="ml-3 shrink-0 font-semibold underline">
                    Retry
                  </button>
                </div>
              )}
              {dialer.status === "initializing" && (
                <p className="m-0 text-center text-xs text-textmuted">Connecting softphone…</p>
              )}
              {!isInCall ? (
                <button
                  type="button"
                  onClick={handleStartCall}
                  disabled={!canCall}
                  className="ti-btn ti-btn-primary-full h-14 w-full gap-2 text-base disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <PhoneCallIcon className="h-5 w-5" />
                  Start {callType === "domestic" ? "Domestic" : "International"} Call
                </button>
              ) : callState === "connecting" ? (
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="ti-btn h-14 w-full border border-amber-200 bg-amber-50 text-base text-amber-700"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  Connecting… (tap to cancel)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="ti-btn ti-btn-danger h-14 w-full gap-2 text-base"
                >
                  <PhoneCallIcon className="h-5 w-5 rotate-[135deg]" />
                  End Call
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 xl:col-span-7">
        <div className="box">
          <div className="box-header">
            <h2 className="box-title">Call Session</h2>
            <span
              className={`badge gap-1.5 ${
                callState === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : callState === "connecting"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-light text-textmuted"
              }`}
            >
              {(callState === "active" || callState === "connecting") && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    callState === "active" ? "animate-pulse bg-emerald-500" : "animate-pulse bg-amber-500"
                  }`}
                />
              )}
              {callState === "idle" && "Ready"}
              {callState === "connecting" && "Connecting"}
              {callState === "active" && "In Progress"}
            </span>
          </div>
          <div className="box-body">
            {callState === "idle" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green/10">
                  <PhoneCallIcon className="h-7 w-7 text-brand-green" />
                </div>
                <p className="m-0 mb-1 text-base font-semibold text-defaulttextcolor">No active call</p>
                <p className="m-0 max-w-sm text-sm text-textmuted">
                  Enter a number and start a call. Your AI agent will handle the conversation via OpenAI.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10 text-xl font-bold text-brand-green">
                    {country.flag}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-lg font-semibold text-defaulttextcolor">
                      {displayNumber || "Unknown"}
                    </p>
                    <p className="m-0 mt-0.5 text-sm text-textmuted">
                      Agent: {agent?.name ?? "—"}
                    </p>
                  </div>
                  {callState === "active" && (
                    <div className="font-mono text-3xl font-bold tracking-wider text-defaulttextcolor">
                      {formatTimer(dialer.durationSeconds)}
                    </div>
                  )}
                </div>

                {callState === "active" && (
                  <div className="flex items-center justify-center gap-4 py-2">
                    <button
                      type="button"
                      onClick={dialer.toggleMute}
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                        dialer.muted
                          ? "border-brand-green bg-brand-green/10"
                          : "border-defaultborder/70 bg-light hover:bg-defaultborder/30"
                      }`}
                      aria-label={dialer.muted ? "Unmute" : "Mute"}
                    >
                      <MicIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleEndCall}
                      className="flex h-14 w-14 items-center justify-center rounded-xl bg-danger text-white shadow-sm transition-opacity hover:opacity-90"
                      aria-label="End call"
                    >
                      <PhoneCallIcon className="h-6 w-6 rotate-[135deg]" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Call Type", value: getCallTypeLabel(callType, country) },
                    { label: "Direction", value: "Outbound" },
                    { label: "Mode", value: "Manual" },
                    { label: "Recording", value: callState === "active" ? "On" : "—" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-defaultborder/50 bg-light/80 p-3">
                      <p className="m-0 mb-0.5 text-[0.65rem] uppercase tracking-wide text-textmuted">{item.label}</p>
                      <p className="m-0 truncate text-sm font-semibold text-defaulttextcolor">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
