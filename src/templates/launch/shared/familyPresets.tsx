import type { FamilyId } from "../../system/types";
import type { LaunchPreset, SectionRenderer } from "./composeLaunchTemplate";
import {
  BandStrip,
  CtaFooterSection,
  FaqAccordion,
  GalleryGrid,
  HeroCentered,
  HeroFullbleed,
  HeroSplit,
  MenuBoard,
  PricingCards,
  QuoteSection,
  ServicesCards,
  ServicesTiles,
  StorySection,
  TestimonialsSection,
  VisitSection,
  WhyUsSection,
} from "./sections";

const aboutR: SectionRenderer = (c, t) => <StorySection content={c.about} theme={t} />;
const galleryR: SectionRenderer = (c, t) => <GalleryGrid content={c.gallery} theme={t} />;
const pricingR: SectionRenderer = (c, t) => <PricingCards content={c.pricing} theme={t} />;
const faqR: SectionRenderer = (c, t) => <FaqAccordion content={c.faq} theme={t} />;
const contactR: SectionRenderer = (c, t) => <VisitSection content={c.contact} theme={t} />;
const ctaR: SectionRenderer = (c, t) => <CtaFooterSection content={c.cta_footer} theme={t} />;

const servicesCardsR: SectionRenderer = (c, t) => <ServicesCards content={c.services} theme={t} />;
const servicesTilesR: SectionRenderer = (c, t) => <ServicesTiles content={c.services} theme={t} />;
const menuBoardR: SectionRenderer = (c, t) => <MenuBoard content={c.services} theme={t} />;
const whyListR: SectionRenderer = (c, t) => <WhyUsSection content={c.why_us} theme={t} />;
const whyBandR: SectionRenderer = (c, t) => <BandStrip content={c.why_us} theme={t} />;
const testCardsR: SectionRenderer = (c, t) => <TestimonialsSection content={c.testimonials} theme={t} />;
const testQuoteR: SectionRenderer = (c, t) => <QuoteSection content={c.testimonials} theme={t} />;

const heroSplitR = (e: string): SectionRenderer => (c, t) => (
  <HeroSplit content={c.hero} theme={t} eyebrow={e} />
);
const heroFullR = (e: string): SectionRenderer => (c, t) => (
  <HeroFullbleed content={c.hero} theme={t} eyebrow={e} />
);
const heroCenterR = (e: string): SectionRenderer => (c, t) => (
  <HeroCentered content={c.hero} theme={t} eyebrow={e} />
);

const common = {
  about: aboutR,
  gallery: galleryR,
  pricing: pricingR,
  faq: faqR,
  contact: contactR,
  cta_footer: ctaR,
};

export const FAMILY_PRESETS: Record<FamilyId, (eyebrow: string) => LaunchPreset> = {
  trust_local: (e) => ({
    family: "trust_local",
    eyebrow: e,
    sections: { hero: heroSplitR(e), services: servicesCardsR, why_us: whyListR, testimonials: testCardsR, ...common },
  }),
  bold_convert: (e) => ({
    family: "bold_convert",
    eyebrow: e,
    sections: { hero: heroFullR(e), services: servicesTilesR, why_us: whyBandR, testimonials: testQuoteR, ...common },
  }),
  clean_pro: (e) => ({
    family: "clean_pro",
    eyebrow: e,
    sections: { hero: heroCenterR(e), services: servicesCardsR, why_us: whyListR, testimonials: testCardsR, ...common },
  }),
  premium_dark: (e) => ({
    family: "premium_dark",
    eyebrow: e,
    sections: { hero: heroFullR(e), services: servicesTilesR, why_us: whyBandR, testimonials: testQuoteR, ...common },
  }),
  warm_craft: (e) => ({
    family: "warm_craft",
    eyebrow: e,
    sections: { hero: heroFullR(e), services: menuBoardR, why_us: whyBandR, testimonials: testQuoteR, ...common },
  }),
  fresh_retail: (e) => ({
    family: "fresh_retail",
    eyebrow: e,
    sections: { hero: heroSplitR(e), services: servicesCardsR, why_us: whyListR, testimonials: testCardsR, ...common },
  }),
  generic: (e) => ({
    family: "generic",
    eyebrow: e,
    sections: { hero: heroCenterR(e), services: servicesCardsR, why_us: whyListR, testimonials: testCardsR, ...common },
  }),
};
