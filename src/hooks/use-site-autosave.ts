"use client";

import { useEffect, useRef } from "react";
import { updateSite } from "@/lib/site-api";
import { configToSitePatch } from "@/lib/site-config";
import { useSiteEditorStore } from "@/store/site-editor-store";

const AUTOSAVE_MS = 1200;

export function useSiteAutosave(siteId: string | undefined) {
  const config = useSiteEditorStore((s) => s.config);
  const saveStatus = useSiteEditorStore((s) => s.saveStatus);
  const setSaveStatus = useSiteEditorStore((s) => s.setSaveStatus);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!siteId || !config || saveStatus !== "dirty") return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const payload = configToSitePatch(config);
      const fingerprint = JSON.stringify(payload);
      if (fingerprint === lastSavedRef.current) {
        setSaveStatus("saved");
        return;
      }
      setSaveStatus("saving");
      try {
        await updateSite(siteId, payload);
        lastSavedRef.current = fingerprint;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, AUTOSAVE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [siteId, config, saveStatus, setSaveStatus]);
}
