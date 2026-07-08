"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "wa-panel-width-ratio";
const LEGACY_STORAGE_KEY = "wa-panel-width";
const DEFAULT_RATIO = 0.38;
const MIN_LEFT_PX = 280;
const MIN_RIGHT_PX = 320;
const DIVIDER_WIDTH = 6;
const DIVIDER_HIT_WIDTH = 14;

type ResizablePanelsProps = {
  left: React.ReactNode;
  right: React.ReactNode;
};

function clampLeftWidth(width: number, containerWidth: number) {
  const maxLeft = containerWidth - MIN_RIGHT_PX - DIVIDER_WIDTH;
  return Math.min(maxLeft, Math.max(MIN_LEFT_PX, width));
}

function readStoredRatio(): number {
  const storedRatio = localStorage.getItem(STORAGE_KEY);
  if (storedRatio) {
    const parsed = parseFloat(storedRatio);
    if (!Number.isNaN(parsed) && parsed > 0.15 && parsed < 0.85) return parsed;
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    const parsed = parseFloat(legacy);
    if (!Number.isNaN(parsed) && parsed > 15 && parsed < 85) return parsed / 100;
  }

  return DEFAULT_RATIO;
}

export function ResizablePanels({ left, right }: ResizablePanelsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const [leftWidth, setLeftWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const measureAndSetWidth = useCallback((ratio?: number) => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.getBoundingClientRect().width;
    if (containerWidth <= 0) return;

    const resolvedRatio = ratio ?? readStoredRatio();
    const next = clampLeftWidth(containerWidth * resolvedRatio, containerWidth);
    setLeftWidth(next);
    return next;
  }, []);

  useEffect(() => {
    measureAndSetWidth();

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (isDraggingRef.current) return;
      setLeftWidth((current) => {
        const containerWidth = container.getBoundingClientRect().width;
        if (current === null) return clampLeftWidth(containerWidth * readStoredRatio(), containerWidth);
        return clampLeftWidth(current, containerWidth);
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [measureAndSetWidth]);

  const persistWidth = useCallback((width: number) => {
    const container = containerRef.current;
    if (!container) return width;

    const containerWidth = container.getBoundingClientRect().width;
    const clamped = clampLeftWidth(width, containerWidth);
    localStorage.setItem(STORAGE_KEY, String(clamped / containerWidth));
    return clamped;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const nextWidth = e.clientX - rect.left;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setLeftWidth(clampLeftWidth(nextWidth, rect.width));
    });
  }, []);

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      setIsDragging(false);

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      setLeftWidth((current) => {
        if (current === null) return current;
        return persistWidth(current);
      });

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer may already be released */
      }
    },
    [persistWidth]
  );

  const nudgeWidth = useCallback(
    (delta: number) => {
      setLeftWidth((current) => {
        const container = containerRef.current;
        if (!container || current === null) return current;
        const clamped = persistWidth(clampLeftWidth(current + delta, container.getBoundingClientRect().width));
        return clamped;
      });
    },
    [persistWidth]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? 48 : 16;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        nudgeWidth(-step);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nudgeWidth(step);
      }
      if (e.key === "Home") {
        e.preventDefault();
        measureAndSetWidth(DEFAULT_RATIO);
        const container = containerRef.current;
        if (container && leftWidth !== null) {
          localStorage.setItem(
            STORAGE_KEY,
            String(clampLeftWidth(container.getBoundingClientRect().width * DEFAULT_RATIO, container.getBoundingClientRect().width) /
              container.getBoundingClientRect().width)
          );
        }
      }
    },
    [nudgeWidth, measureAndSetWidth, leftWidth]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const resolvedLeftWidth = leftWidth ?? MIN_LEFT_PX;

  return (
    <div
      ref={containerRef}
      className={`wa-split-layout flex h-full overflow-hidden ${isDragging ? "wa-split-dragging" : ""}`}
    >
      <div
        className="wa-split-left flex min-w-0 shrink-0 flex-col overflow-hidden"
        style={{
          width: resolvedLeftWidth,
          flexBasis: resolvedLeftWidth,
          transition: isDragging ? "none" : "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuemin={MIN_LEFT_PX}
        aria-valuenow={resolvedLeftWidth}
        aria-label="Resize panels"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        className={`wa-split-divider group relative z-20 shrink-0 touch-none select-none ${isDragging ? "wa-split-divider-active" : ""}`}
        style={{ width: DIVIDER_WIDTH }}
      >
        <div
          className="wa-split-divider-hit absolute inset-y-0 left-1/2 -translate-x-1/2"
          style={{ width: DIVIDER_HIT_WIDTH }}
        />
        <div className="wa-split-divider-handle pointer-events-none absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </div>

      <div
        className="wa-split-right relative flex min-w-0 flex-1 flex-col overflow-hidden"
        style={{ transition: isDragging ? "none" : "flex 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {isDragging && <div className="wa-split-drag-shield absolute inset-0 z-50" aria-hidden />}
        {right}
      </div>
    </div>
  );
}
