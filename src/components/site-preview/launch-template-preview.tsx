"use client";

import { useEffect, useState } from "react";
import { getSite } from "@/lib/site-api";
import { brandNameFromConfig, siteRecordToConfig } from "@/lib/site-config";
import { SiteRenderer, type LaunchTemplateId } from "@/templates/launch/SiteRenderer";
import type { SiteContent, SiteTheme } from "@/templates/system/types";

export function LaunchTemplatePreview({
  templateId,
  siteId,
}: {
  templateId: LaunchTemplateId;
  siteId?: string | null;
}) {
  const [content, setContent] = useState<SiteContent | undefined>();
  const [theme, setTheme] = useState<SiteTheme | undefined>();
  const [brandName, setBrandName] = useState<string | undefined>();
  const [loading, setLoading] = useState(Boolean(siteId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) return;
    let cancelled = false;
    (async () => {
      try {
        const site = await getSite(siteId);
        const config = siteRecordToConfig(site);
        if (!cancelled) {
          setContent(config.content);
          setTheme(config.theme);
          setBrandName(brandNameFromConfig(config));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load site");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-600">Loading site…</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;
  }

  return (
    <SiteRenderer
      templateId={templateId}
      content={content}
      theme={theme}
      brandName={brandName}
    />
  );
}
