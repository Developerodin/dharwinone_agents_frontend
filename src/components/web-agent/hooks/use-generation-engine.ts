"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GENERATION_STAGES } from "@/lib/constants";

export type GenerationPhase = "idle" | "thinking" | "building" | "generating" | "stopped" | "complete";

export type GenerationState = {
  phase: GenerationPhase;
  stageIndex: number;
  progress: number;
};

const THINKING_MS = 1400;
const BUILDING_MS = 1600;
const STAGE_MS = 900;

export function useGenerationEngine() {
  const [state, setState] = useState<GenerationState>({
    phase: "idle",
    stageIndex: 0,
    progress: 0,
  });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearAll = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timersRef.current = [];
    intervalsRef.current = [];
  }, []);

  const startGeneratingStages = useCallback(() => {
    setState({ phase: "generating", stageIndex: 0, progress: 20 });
    let stage = 0;
    const interval = setInterval(() => {
      stage++;
      if (stage >= GENERATION_STAGES.length) {
        clearInterval(interval);
        setState({ phase: "complete", stageIndex: GENERATION_STAGES.length - 1, progress: 100 });
        return;
      }
      setState({
        phase: "generating",
        stageIndex: stage,
        progress: 20 + ((stage + 1) / GENERATION_STAGES.length) * 75,
      });
    }, STAGE_MS);
    intervalsRef.current.push(interval);
  }, []);

  const startGathering = useCallback(() => {
    clearAll();
    setState({ phase: "thinking", stageIndex: 0, progress: 0 });

    const t1 = setTimeout(() => {
      setState({ phase: "building", stageIndex: 0, progress: 10 });
      const t2 = setTimeout(() => {
        setState({ phase: "generating", stageIndex: 0, progress: 18 });
        let stage = 0;
        const interval = setInterval(() => {
          stage = (stage + 1) % GENERATION_STAGES.length;
          setState((prev) => ({
            phase: "generating",
            stageIndex: stage,
            progress: Math.min(prev.progress + 1.5, 72),
          }));
        }, STAGE_MS);
        intervalsRef.current.push(interval);
      }, BUILDING_MS);
      timersRef.current.push(t2);
    }, THINKING_MS);
    timersRef.current.push(t1);
  }, [clearAll]);

  const start = useCallback(() => {
    clearAll();
    setState({ phase: "thinking", stageIndex: 0, progress: 0 });

    const t1 = setTimeout(() => {
      setState({ phase: "building", stageIndex: 0, progress: 10 });
      const t2 = setTimeout(startGeneratingStages, BUILDING_MS);
      timersRef.current.push(t2);
    }, THINKING_MS);
    timersRef.current.push(t1);
  }, [clearAll, startGeneratingStages]);

  const stop = useCallback(() => {
    clearAll();
    setState((prev) =>
      prev.phase === "thinking" || prev.phase === "building" || prev.phase === "generating"
        ? { ...prev, phase: "stopped" }
        : prev
    );
  }, [clearAll]);

  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== "stopped") return prev;
      const stage = prev.stageIndex;
      const interval = setInterval(() => {
        setState((current) => {
          if (current.phase !== "generating" && current.phase !== "stopped") return current;
          const next = current.stageIndex + 1;
          if (next >= GENERATION_STAGES.length) {
            clearInterval(interval);
            return { phase: "complete", stageIndex: GENERATION_STAGES.length - 1, progress: 100 };
          }
          return {
            phase: "generating",
            stageIndex: next,
            progress: 20 + ((next + 1) / GENERATION_STAGES.length) * 75,
          };
        });
      }, STAGE_MS);
      intervalsRef.current.push(interval);
      return { phase: "generating", stageIndex: stage, progress: prev.progress };
    });
  }, []);

  const reset = useCallback(() => {
    clearAll();
    setState({ phase: "idle", stageIndex: 0, progress: 0 });
  }, [clearAll]);

  useEffect(() => () => clearAll(), [clearAll]);

  return { state, start, startGathering, stop, resume, reset };
}
