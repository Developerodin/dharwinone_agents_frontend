import type { LaunchTemplateProps } from "../registry";
import { FAMILIES } from "../../families";
import { templateFontClasses } from "../../fonts";
import { visibleSections } from "../../system/applyTheme";
import { SiteFooter, SiteHeader, SiteRoot } from "../shared/primitives";
import {
  CtaFooterSection,
  HeroFullbleed,
  ServicesTiles,
  TestimonialsSection,
  WhyUsSection,
} from "../shared/sections";

const FAMILY = FAMILIES.bold_convert;

/** Full-bleed urgency layout for local electricians (plan §13 launch template). */
export function ElectricianBoldTemplate({ content, theme, brandName }: LaunchTemplateProps) {
  if (!content || !theme) return null;
  const brand = brandName ?? content.seo?.title?.split("—")[0]?.trim() ?? "Your Business";
  const order = visibleSections(theme);

  const sectionMap = {
    hero: <HeroFullbleed content={content.hero} theme={theme} eyebrow="24/7 Emergency" />,
    services: <ServicesTiles content={content.services} theme={theme} />,
    why_us: <WhyUsSection content={content.why_us} theme={theme} />,
    testimonials: <TestimonialsSection content={content.testimonials} theme={theme} />,
    cta_footer: <CtaFooterSection content={content.cta_footer} theme={theme} />,
  } as const;

  return (
    <div className={templateFontClasses}>
      <SiteRoot theme={theme} family={FAMILY} templateId="electrician_bold_v1">
        <SiteHeader brand={brand} cta={content.hero.cta_text} theme={theme} />
        <main>
          {order.map((key) => (
            <div key={key}>{sectionMap[key as keyof typeof sectionMap]}</div>
          ))}
        </main>
        <SiteFooter brand={brand} />
      </SiteRoot>
    </div>
  );
}
