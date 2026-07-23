import type { SiteContent, SiteTheme } from "../system/types";
import { getLaunchTemplate, type LaunchTemplateId } from "./registry";

export interface SiteRendererProps {
  templateId: LaunchTemplateId;
  content?: SiteContent;
  theme?: SiteTheme;
  brandName?: string;
}

/**
 * Phase 1 site renderer: template(id) + content JSON + theme JSON.
 * Used by editor preview, generation skeleton, and publish SSG.
 */
export function SiteRenderer({ templateId, content, theme, brandName }: SiteRendererProps) {
  const pkg = getLaunchTemplate(templateId);
  if (!pkg) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        Unknown template: <code>{templateId}</code>
      </div>
    );
  }

  const { Component, default_content, default_theme } = pkg;
  const resolvedContent = content ?? default_content;
  const resolvedTheme = theme ?? default_theme;
  return (
    <Component content={resolvedContent} theme={resolvedTheme} brandName={brandName} />
  );
}

export { LAUNCH_TEMPLATES, getLaunchTemplate, listLaunchTemplates } from "./registry";
export type { LaunchTemplateId } from "./registry";
