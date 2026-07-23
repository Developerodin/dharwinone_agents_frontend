import type { LaunchTemplateProps } from "../registry";
import { FAMILIES } from "../../families";
import { templateFontClasses } from "../../fonts";
import { visibleSections } from "../../system/applyTheme";
import { SiteFooter, SiteHeader, SiteRoot } from "../shared/primitives";
import {
  BandStrip,
  CtaFooterSection,
  HeroFullbleed,
  MenuBoard,
  QuoteSection,
  StorySection,
  VisitSection,
} from "../shared/sections";

const FAMILY = FAMILIES.warm_craft;

/** Warm-craft cafe layout: fullbleed hero, menu board, story, band, quote, visit. */
export function CafeWarmTemplate({ content, theme, brandName }: LaunchTemplateProps) {
  if (!content || !theme) return null;
  const brand = brandName ?? content.seo?.title?.split("—")[0]?.trim() ?? "Your Business";
  const order = visibleSections(theme);

  const sectionMap = {
    hero: <HeroFullbleed content={content.hero} theme={theme} eyebrow="Café / Restaurant" />,
    services: <MenuBoard content={content.services} theme={theme} />,
    about: <StorySection content={content.about} theme={theme} />,
    why_us: <BandStrip content={content.why_us} theme={theme} />,
    testimonials: <QuoteSection content={content.testimonials} theme={theme} />,
    contact: <VisitSection content={content.contact} theme={theme} />,
    cta_footer: <CtaFooterSection content={content.cta_footer} theme={theme} />,
  } as const;

  return (
    <div className={templateFontClasses}>
      <SiteRoot theme={theme} family={FAMILY} templateId="ht_cafe_v1">
        <SiteHeader brand={brand} cta={content.hero.cta_text} theme={theme} />
        <main>
          {order.map((key) => {
            const section = sectionMap[key as keyof typeof sectionMap];
            return section ? <div key={key}>{section}</div> : null;
          })}
        </main>
        <SiteFooter brand={brand} />
      </SiteRoot>
    </div>
  );
}
