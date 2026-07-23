"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import {
  brandNameFromConfig,
  isLaunchTemplateId,
  siteRecordToConfig,
} from "@/lib/site-config";
import { getSite } from "@/lib/sites-api";
import { BaseTemplate } from "@/templates/BaseTemplate";
import { SiteRenderer, type LaunchTemplateId } from "@/templates/launch/SiteRenderer";
import type { SiteContent, SiteTheme } from "@/templates/system/types";
import type { TemplateId } from "@/templates/packages";

export function DraftSitePreview({
  siteId,
  cacheVersion,
}: {
  siteId: string;
  cacheVersion?: string;
}) {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent | undefined>();
  const [theme, setTheme] = useState<SiteTheme | undefined>();
  const [brandName, setBrandName] = useState<string>("Your Business");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      setError("Sign in to preview this site.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const site = await getSite(siteId);
        const config = siteRecordToConfig(site);
        if (cancelled) return;
        setTemplateId(config.templateId);
        setContent(config.content);
        setTheme(config.theme);
        setBrandName(brandNameFromConfig(config));
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
  }, [siteId, cacheVersion]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-600">Loading preview…</div>;
  }

  if (error || !templateId) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        {error ?? "Site not found"}
      </div>
    );
  }

  if (isLaunchTemplateId(templateId)) {
    return (
      <SiteRenderer
        templateId={templateId as LaunchTemplateId}
        content={content}
        theme={theme}
        brandName={brandName}
      />
    );
  }

  return (
    <BaseTemplate
      templateId={templateId as TemplateId}
      content={content}
      theme={theme}
      brandName={brandName}
    />
  );
}
