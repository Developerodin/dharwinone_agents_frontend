"use client";

import type { GatheringStatus } from "../hooks/use-requirement-gathering";

const STATUS_LABELS: Record<Exclude<GatheringStatus, "idle" | "asking" | "complete">, string> = {
  thinking: "Thinking...",
  understanding: "Understanding requirements...",
  building: "Building...",
};

type ConversationStatusProps = {
  status: GatheringStatus;
  centered?: boolean;
};

export function ConversationStatus({ status, centered }: ConversationStatusProps) {
  if (status === "idle" || status === "asking" || status === "complete") return null;

  const label = STATUS_LABELS[status];

  return (
    <div className={`wa-animate-fade-up mt-4 flex ${centered ? "justify-start" : "justify-start"}`}>
      <div className="wa-chat-bubble-ai max-w-[88%] rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            key={status}
            className="wa-status-enter text-sm font-medium"
            style={{ animation: "wa-thinking-pulse 1.5s ease-in-out infinite" }}
          >
            {label}
          </span>
          <div className="flex gap-1">
            <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
            <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
            <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
          </div>
        </div>
      </div>
    </div>
  );
}
