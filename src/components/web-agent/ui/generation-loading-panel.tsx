"use client";

import { useEffect, useState } from "react";
import { WORKSPACE_GENERATION_MESSAGES } from "@/lib/constants";
import type { GenerationState } from "../hooks/use-generation-engine";
import { SparklesIcon } from "@/components/icons";

type GenerationLoadingPanelProps = {
  generation: GenerationState;
};

export function GenerationLoadingPanel({ generation }: GenerationLoadingPanelProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [messageVisible, setMessageVisible] = useState(true);

  useEffect(() => {
    if (generation.phase === "idle" || generation.phase === "complete" || generation.phase === "stopped") return;

    const interval = setInterval(() => {
      setMessageVisible(false);
      setTimeout(() => {
        setMessageIndex((i) => (i + 1) % WORKSPACE_GENERATION_MESSAGES.length);
        setMessageVisible(true);
      }, 280);
    }, 2400);

    return () => clearInterval(interval);
  }, [generation.phase]);

  const statusMessage =
    generation.phase === "thinking"
      ? "Analyzing your prompt..."
      : generation.phase === "building"
        ? "Building your website..."
        : WORKSPACE_GENERATION_MESSAGES[messageIndex];

  const showCyclingMessage = generation.phase === "generating";

  return (
    <div className="wa-generation-panel flex h-full flex-col overflow-hidden bg-gradient-to-br from-[#f8faf9] via-white to-[#f0f7f4]">
      <div className="wa-generation-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="wa-generation-orb relative mb-8 flex h-20 w-20 items-center justify-center">
          <div className="wa-generation-ring absolute inset-0 rounded-full" />
          <div className="wa-generation-ring wa-generation-ring-delay absolute inset-[-8px] rounded-full" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-brand-green/15">
            <SparklesIcon className="h-7 w-7 text-brand-green wa-generation-sparkle" />
          </div>
        </div>

        <div className="mb-10 h-8 text-center">
          {showCyclingMessage ? (
            <p
              key={messageIndex}
              className={`m-0 font-poppins text-lg font-semibold text-defaulttextcolor transition-all duration-300 ${
                messageVisible ? "wa-status-enter opacity-100" : "translate-y-1 opacity-0"
              }`}
            >
              {statusMessage}
            </p>
          ) : (
            <p
              key={generation.phase}
              className="wa-status-enter m-0 font-poppins text-lg font-semibold text-defaulttextcolor"
            >
              {statusMessage}
            </p>
          )}
        </div>

        <div className="wa-wireframe w-full max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-defaultborder/30 bg-white shadow-xl ring-1 ring-black/[0.03]">
            <div className="border-b border-defaultborder/25 px-5 py-3">
              <div className="wa-wireframe-block wa-shimmer h-3 w-24 rounded-full" style={{ animationDelay: "0s" }} />
            </div>

            <div className="space-y-5 p-6">
              <div className="space-y-3">
                <div className="wa-wireframe-block wa-shimmer h-5 w-3/5 rounded-lg" style={{ animationDelay: "0.1s" }} />
                <div className="wa-wireframe-block wa-shimmer h-4 w-4/5 rounded-lg" style={{ animationDelay: "0.2s" }} />
                <div className="wa-wireframe-block wa-shimmer h-4 w-2/3 rounded-lg" style={{ animationDelay: "0.3s" }} />
              </div>

              <div className="wa-wireframe-block wa-shimmer h-36 w-full rounded-xl" style={{ animationDelay: "0.4s" }} />

              <div className="grid grid-cols-3 gap-3">
                <div className="wa-wireframe-block wa-shimmer h-24 rounded-xl" style={{ animationDelay: "0.5s" }} />
                <div className="wa-wireframe-block wa-shimmer h-24 rounded-xl" style={{ animationDelay: "0.6s" }} />
                <div className="wa-wireframe-block wa-shimmer h-24 rounded-xl" style={{ animationDelay: "0.7s" }} />
              </div>

              <div className="flex justify-center pt-1">
                <div className="wa-wireframe-block wa-shimmer h-10 w-40 rounded-full" style={{ animationDelay: "0.8s" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2">
          <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
          <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
          <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
        </div>
      </div>
    </div>
  );
}
