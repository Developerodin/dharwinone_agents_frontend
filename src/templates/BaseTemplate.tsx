import { Fragment, type ReactNode } from "react";
import type { SectionKey, SiteContent, SiteTheme } from "./system/types";
import { themeToVars, visibleSections } from "./system/theme";
import { FAMILIES } from "./families";
import { templateFontClasses } from "./fonts";
import { PACKAGES, type TemplateId } from "./packages";
import * as S from "./sections";

// ponytail: one parameterized template instantiated per template_id via its JSON
// package + family config. Per-template bespoke layouts arrive with the HTML
// conversions (master plan v2 §2.6); the section contract stays identical.

export interface BaseTemplateEditorProps {
  selectedSection?: SectionKey | null;
  selectedElementKey?: string | null;
  /** When true, sections expose data-section-key for the visual editor shell. */
  editorMode?: boolean;
}

export interface BaseTemplateProps {
  templateId: TemplateId;
  content?: SiteContent; // defaults to package fallback content
  theme?: SiteTheme; // defaults to package family theme
  brandName?: string; // defaults to the sample brand in seo.title
  editor?: BaseTemplateEditorProps;
}

function pretty(s: string | null | undefined): string {
  return (s ?? "").split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function sectionWrap(
  key: SectionKey,
  node: ReactNode,
  editor?: BaseTemplateEditorProps,
): ReactNode {
  if (!node) return null;
  if (!editor?.editorMode) {
    return <Fragment key={key}>{node}</Fragment>;
  }
  const selected = editor.selectedSection === key;
  return (
    <div
      key={key}
      data-section-key={key}
      style={{
        outline: selected ? "2px solid #41a454" : undefined,
        outlineOffset: selected ? 2 : undefined,
        position: "relative",
      }}
    >
      {node}
    </div>
  );
}

export function BaseTemplate({ templateId, content, theme, brandName, editor }: BaseTemplateProps) {
  const pkg = PACKAGES[templateId];
  const c = content ?? (pkg.content as unknown as SiteContent);
  const t = theme ?? (pkg.theme as unknown as SiteTheme);
  const family = FAMILIES[pkg.registry.family as keyof typeof FAMILIES] ?? FAMILIES.generic;
  const brand = brandName ?? c.seo?.title?.split("—")[0]?.trim() ?? "Your Business";
  const eyebrow = pretty(pkg.registry.subcategory) || "Local Business";

  const sections = visibleSections(t);
  return (
    <div
      data-template-id={templateId}
      data-template-family={family.id}
      className={templateFontClasses}
      style={{
        ...themeToVars(t, family),
        backgroundColor: "var(--site-bg)",
        color: "var(--site-ink)",
        fontFamily: "var(--site-font-body)",
        lineHeight: 1.6,
      }}
    >
      <S.Header brand={brand} cta={c.hero?.cta_text ?? "Contact us"} theme={t} visibleSections={sections} />
      <main>
      {sections.map((key) => {
        switch (key) {
          case "hero":
            return sectionWrap(
              key,
              c.hero && (
                <div>
                  <S.Hero
                    c={c.hero}
                    theme={t}
                    family={family}
                    eyebrow={eyebrow}
                    chip={c.gallery?.items?.[0]?.caption}
                  />
                  {family.hero === "split" && c.why_us?.points?.length ? (
                    <S.TrustStrip points={c.why_us.points} />
                  ) : null}
                </div>
              ),
              editor,
            );
          case "services":
            return sectionWrap(key, c.services && <S.Services c={c.services} theme={t} family={family} />, editor);
          case "about":
            return sectionWrap(key, c.about && <S.About c={c.about} theme={t} family={family} />, editor);
          case "why_us":
            return sectionWrap(key, c.why_us && <S.WhyUs c={c.why_us} theme={t} family={family} />, editor);
          case "gallery":
            return sectionWrap(key, c.gallery && <S.Gallery c={c.gallery} theme={t} family={family} />, editor);
          case "testimonials":
            return sectionWrap(
              key,
              c.testimonials && <S.Testimonials c={c.testimonials} theme={t} family={family} />,
              editor,
            );
          case "pricing":
            return sectionWrap(key, c.pricing && <S.Pricing c={c.pricing} theme={t} family={family} />, editor);
          case "faq":
            return sectionWrap(key, c.faq && <S.Faq c={c.faq} theme={t} family={family} />, editor);
          case "contact":
            return sectionWrap(key, c.contact && <S.Contact c={c.contact} theme={t} family={family} />, editor);
          case "cta_footer":
            return sectionWrap(
              key,
              c.cta_footer && <S.CtaFooter c={c.cta_footer} theme={t} family={family} />,
              editor,
            );
          default:
            return null;
        }
      })}
      </main>
      <S.Footer brand={brand} phone={c.contact?.phone} email={c.contact?.email} />
    </div>
  );
}

// keep type import referenced for section-key exhaustiveness reasoning
export type { SectionKey };
