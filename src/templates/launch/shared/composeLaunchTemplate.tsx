import type { ComponentType, ReactNode } from "react";
import type { LaunchTemplateProps } from "../registry";
import type { FamilyId, SectionKey, SiteContent, SiteTheme } from "../../system/types";
import { FAMILIES } from "../../families";
import { templateFontClasses } from "../../fonts";
import { visibleSections } from "../../system/applyTheme";
import { SiteFooter, SiteHeader, SiteRoot } from "./primitives";

export type SectionRenderer = (content: SiteContent, theme: SiteTheme) => ReactNode;

export interface LaunchPreset {
  family: FamilyId;
  eyebrow: string;
  sections: Partial<Record<SectionKey, SectionRenderer>>;
}

/** Build a launch template component from a family preset. Renders the sections
 *  in the theme's order, skipping any the preset doesn't provide a renderer for. */
export function composeLaunchTemplate(
  templateId: string,
  preset: LaunchPreset,
): ComponentType<LaunchTemplateProps> {
  const family = FAMILIES[preset.family] ?? FAMILIES.generic;

  function LaunchTemplate({ content, theme, brandName }: LaunchTemplateProps) {
    if (!content || !theme) return null;
    const brand = brandName ?? content.seo?.title?.split("—")[0]?.trim() ?? "Your Business";
    const order = visibleSections(theme);
    return (
      <div className={templateFontClasses}>
        <SiteRoot theme={theme} family={family} templateId={templateId}>
          <SiteHeader brand={brand} cta={content.hero.cta_text} theme={theme} />
          <main>
            {order.map((key) => {
              const renderSection = preset.sections[key];
              return renderSection ? <div key={key}>{renderSection(content, theme)}</div> : null;
            })}
          </main>
          <SiteFooter brand={brand} />
        </SiteRoot>
      </div>
    );
  }

  LaunchTemplate.displayName = `Launch(${templateId})`;
  return LaunchTemplate;
}
