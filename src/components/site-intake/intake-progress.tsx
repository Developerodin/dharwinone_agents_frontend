"use client";

import type { IntakeStepId } from "@/lib/intake-types";
import { INTAKE_STEPS } from "@/lib/intake-types";

type IntakeProgressProps = {
  current: IntakeStepId;
  progressLabel?: string;
};

const VISIBLE_STEPS = INTAKE_STEPS.filter((s) => s.id !== "generating");

function stepIndex(step: IntakeStepId): number {
  if (step === "generating") return VISIBLE_STEPS.length;
  const idx = VISIBLE_STEPS.findIndex((s) => s.id === step);
  return idx >= 0 ? idx : 0;
}

export function IntakeProgress({ current, progressLabel }: IntakeProgressProps) {
  const active = stepIndex(current);
  const pct = Math.round(((active + 1) / VISIBLE_STEPS.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-xs font-medium uppercase tracking-wide text-textmuted">
          Step {Math.min(active + 1, VISIBLE_STEPS.length)} of {VISIBLE_STEPS.length}
        </p>
        {progressLabel ? (
          <p className="m-0 text-xs font-medium text-brand-green">{progressLabel}</p>
        ) : null}
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-brand-green transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="hidden sm:flex flex-wrap gap-2">
        {VISIBLE_STEPS.map((step, index) => {
          const done = index < active;
          const isCurrent = index === active;
          return (
            <span
              key={step.id}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                isCurrent
                  ? "bg-brand-green/10 text-brand-green ring-1 ring-brand-green/20"
                  : done
                    ? "bg-[#F0FDF4] text-[#166534]"
                    : "bg-[#F8FAFC] text-textmuted"
              }`}
            >
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
