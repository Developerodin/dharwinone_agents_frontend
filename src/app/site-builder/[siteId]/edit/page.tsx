"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteEditorShell } from "@/components/site-editor/site-editor-shell";
import { getSite } from "@/lib/site-api";
import { siteRecordToConfig } from "@/lib/site-config";
import { getToken } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { useSiteEditorStore } from "@/store/site-editor-store";

export default function SiteEditorPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = params.siteId;
  const router = useRouter();
  const loadConfig = useSiteEditorStore((s) => s.loadConfig);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace(ROUTES.signIn);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const site = await getSite(siteId);
        if (!cancelled) loadConfig(siteRecordToConfig(site));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load site");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [siteId, loadConfig, router]);

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-red-50 p-6 text-sm text-red-800">
        {error}
      </div>
    );
  }

  return <SiteEditorShell siteId={siteId} />;
}
