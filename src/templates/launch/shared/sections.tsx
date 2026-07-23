import type { LaunchSiteContent } from "../../system/schema";
import type { SiteContent, SiteTheme } from "../../system/types";
import { sectionStyle } from "../../system/applyTheme";
import { CtaButton, Kicker, ScrimOverlay, SectionTitle, SiteWrap, SlotImage } from "./primitives";

export function HeroSplit({
  content,
  theme,
  eyebrow,
}: {
  content: LaunchSiteContent["hero"];
  theme: SiteTheme;
  eyebrow: string;
}) {
  const style = sectionStyle(theme, "hero");
  return (
    <section id="hero" data-section="hero" style={style} className="bg-bg pt-16 pb-12 sm:pt-20 sm:pb-16">
      <SiteWrap className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12">
        <div className="min-w-0">
          <Kicker>{eyebrow}</Kicker>
          <h1
            data-element-key="hero.headline"
            className="mb-5 font-heading text-[clamp(2rem,5.5vw,3.5rem)] font-extrabold leading-[1.08] text-ink"
          >
            {content.headline}
          </h1>
          <p
            data-element-key="hero.subtext"
            className="mb-8 max-w-[44ch] text-[1.05rem] leading-relaxed text-muted"
          >
            {content.subtext}
          </p>
          <div className="flex flex-wrap gap-3">
            <CtaButton elementKey="hero.cta_button" theme={theme}>
              {content.cta_text}
            </CtaButton>
            <CtaButton elementKey="hero.cta_secondary" theme={theme} ghost href="#services">
              Our services
            </CtaButton>
          </div>
        </div>
        <figure className="relative m-0 min-h-[280px] overflow-hidden rounded-site sm:min-h-[380px]">
          <SlotImage slot="hero.background" src={content.image} alt="" eager className="min-h-[280px] sm:min-h-[380px]" />
        </figure>
      </SiteWrap>
    </section>
  );
}

export function HeroFullbleed({
  content,
  theme,
  eyebrow,
}: {
  content: LaunchSiteContent["hero"];
  theme: SiteTheme;
  eyebrow: string;
}) {
  const style = sectionStyle(theme, "hero");
  return (
    <section
      id="hero"
      data-section="hero"
      style={{ ...style, color: "var(--section-hero-text, var(--site-on-dark))" }}
      className="relative min-h-[75vh] px-5 sm:min-h-[80vh]"
    >
      <div className="absolute inset-0 bg-ink">
        <SlotImage slot="hero.background" src={content.image} alt="" eager className="min-h-full opacity-90" />
      </div>
      <ScrimOverlay />
      <SiteWrap className="relative flex min-h-[75vh] flex-col justify-end pb-14 pt-24 sm:min-h-[80vh] sm:pb-16 sm:pt-28">
        <p className="mb-5 text-[0.78rem] font-bold uppercase tracking-[0.18em] text-hero-accent">{eyebrow}</p>
        <h1
          data-element-key="hero.headline"
          className="mb-5 max-w-[16ch] font-heading text-[clamp(2.25rem,7vw,4.5rem)] font-extrabold uppercase leading-[1.02] text-on-dark"
        >
          {content.headline}
        </h1>
        <p data-element-key="hero.subtext" className="mb-8 max-w-[44ch] text-[1.05rem] leading-relaxed opacity-90">
          {content.subtext}
        </p>
        <div className="flex flex-wrap gap-3">
          <CtaButton elementKey="hero.cta_button" theme={theme}>
            {content.cta_text}
          </CtaButton>
        </div>
      </SiteWrap>
    </section>
  );
}

export function ServicesCards({
  content,
  theme,
}: {
  content: LaunchSiteContent["services"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "services");
  return (
    <section id="services" data-section="services" style={style} className="bg-surface">
      <SiteWrap>
        <SectionTitle elementKey="services.section_title">{content.section_title}</SectionTitle>
        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item, i) => (
            <li
              key={i}
              className="overflow-hidden rounded-site border border-line bg-bg"
            >
              <div className="h-[180px] sm:h-[200px]">
                <SlotImage slot={`services.items[${i}].image`} src={item.image} alt={item.title} />
              </div>
              <div className="p-5">
                <h3
                  data-element-key={`services.items[${i}].title`}
                  className="mb-2 font-heading text-lg font-bold text-ink"
                >
                  {item.title}
                </h3>
                <p data-element-key={`services.items[${i}].desc`} className="m-0 text-sm leading-relaxed text-muted">
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </SiteWrap>
    </section>
  );
}

export function ServicesTiles({
  content,
  theme,
}: {
  content: LaunchSiteContent["services"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "services");
  return (
    <section id="services" data-section="services" style={style}>
      <SiteWrap>
        <SectionTitle elementKey="services.section_title">{content.section_title}</SectionTitle>
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
          {content.items.map((item, i) => (
            <li
              key={i}
              className="grid grid-cols-[120px_1fr] overflow-hidden rounded-site border border-line bg-surface sm:grid-cols-[140px_1fr]"
            >
              <div className="min-h-[120px]">
                <SlotImage slot={`services.items[${i}].image`} src={item.image} alt={item.title} />
              </div>
              <div className="flex min-w-0 flex-col justify-center p-4">
                <h3
                  data-element-key={`services.items[${i}].title`}
                  className="mb-1 font-heading text-base font-bold uppercase tracking-wide text-ink"
                >
                  {item.title}
                </h3>
                <p data-element-key={`services.items[${i}].desc`} className="m-0 text-sm text-muted">
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </SiteWrap>
    </section>
  );
}

export function WhyUsSection({
  content,
  theme,
}: {
  content: LaunchSiteContent["why_us"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "why_us");
  return (
    <section id="why_us" data-section="why_us" style={style} className="bg-bg">
      <SiteWrap>
        <SectionTitle elementKey="why_us.section_title">{content.section_title}</SectionTitle>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {content.points.map((point, i) => (
            <li
              key={i}
              data-element-key={`why_us.points[${i}]`}
              className="rounded-site border border-line bg-surface px-5 py-4 text-sm font-semibold text-ink"
            >
              <span className="mr-2 text-accent">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </SiteWrap>
    </section>
  );
}

export function TestimonialsSection({
  content,
  theme,
}: {
  content: LaunchSiteContent["testimonials"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "testimonials");
  return (
    <section id="testimonials" data-section="testimonials" style={style} className="bg-surface">
      <SiteWrap>
        <SectionTitle elementKey="testimonials.section_title">{content.section_title}</SectionTitle>
        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2">
          {content.items.map((item, i) => (
            <li
              key={i}
              className="flex flex-col gap-4 rounded-site border border-line bg-bg p-5"
            >
              <blockquote
                data-element-key={`testimonials.items[${i}].quote`}
                className="m-0 text-base leading-relaxed text-ink"
              >
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div className="mt-auto flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  <SlotImage slot={`testimonials.items[${i}].avatar`} src={item.avatar} alt={item.name} />
                </div>
                <cite
                  data-element-key={`testimonials.items[${i}].name`}
                  className="not-italic text-sm font-bold text-ink"
                >
                  {item.name}
                </cite>
              </div>
            </li>
          ))}
        </ul>
      </SiteWrap>
    </section>
  );
}

export function CtaFooterSection({
  content,
  theme,
}: {
  content: LaunchSiteContent["cta_footer"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "cta_footer");
  return (
    <section
      id="cta_footer"
      data-section="cta_footer"
      style={{ ...style, backgroundColor: "var(--section-cta_footer-bg, var(--site-primary))", color: "var(--section-cta_footer-text, var(--site-on-primary))" }}
      className="text-center"
    >
      <SiteWrap>
        <h2
          data-element-key="cta_footer.headline"
          className="mb-6 font-heading text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold"
        >
          {content.headline}
        </h2>
        <CtaButton elementKey="cta_footer.cta_button" theme={theme}>
          {content.cta_text}
        </CtaButton>
      </SiteWrap>
    </section>
  );
}

export function TrustStrip({ points }: { points: string[] }) {
  return (
    <div className="border-y border-line bg-bg px-5 py-4">
      <SiteWrap className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-center text-xs font-bold uppercase tracking-wide text-muted">
        {points.map((p, i) => (
          <span key={i} data-element-key={`why_us.points[${i}]`}>
            {p}
          </span>
        ))}
      </SiteWrap>
    </div>
  );
}

export function MenuBoard({
  content,
  theme,
}: {
  content: SiteContent["services"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "services");
  return (
    <section id="menu" data-section="services" style={style} className="bg-surface">
      <SiteWrap>
        <SectionTitle elementKey="services.section_title">{content.section_title}</SectionTitle>
        <ul className="m-0 grid list-none grid-cols-1 gap-x-12 gap-y-6 p-0 md:grid-cols-2">
          {content.items.map((item, i) => (
            <li key={i} className="border-b border-dashed border-line pb-4">
              <h3
                data-element-key={`services.items[${i}].title`}
                className="mb-1 font-heading text-lg font-bold text-ink"
              >
                {item.title}
              </h3>
              <p
                data-element-key={`services.items[${i}].desc`}
                className="m-0 text-sm leading-relaxed text-muted"
              >
                {item.desc}
              </p>
            </li>
          ))}
        </ul>
      </SiteWrap>
    </section>
  );
}

export function StorySection({
  content,
  theme,
}: {
  content: SiteContent["about"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "about");
  return (
    <section id="story" data-section="about" style={style} className="bg-bg">
      <SiteWrap className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12">
        <figure className="relative m-0 min-h-[300px] overflow-hidden rounded-site">
          <SlotImage slot="about.image" src={content.image} alt="" className="min-h-[300px]" />
        </figure>
        <div className="min-w-0">
          <SectionTitle elementKey="about.section_title">{content.section_title}</SectionTitle>
          <p
            data-element-key="about.body"
            className="m-0 text-[1.05rem] leading-relaxed text-muted"
          >
            {content.body}
          </p>
        </div>
      </SiteWrap>
    </section>
  );
}

export function BandStrip({
  content,
  theme,
}: {
  content: SiteContent["why_us"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "why_us");
  return (
    <section
      id="band"
      data-section="why_us"
      style={{
        ...style,
        backgroundColor: "var(--section-why_us-bg, var(--site-primary))",
        color: "var(--section-why_us-text, var(--site-on-primary))",
      }}
    >
      <SiteWrap className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center">
        {content.points.map((point, i) => (
          <span
            key={i}
            data-element-key={`why_us.points[${i}]`}
            className="font-heading text-base font-bold uppercase tracking-wide"
          >
            {point}
          </span>
        ))}
      </SiteWrap>
    </section>
  );
}

export function QuoteSection({
  content,
  theme,
}: {
  content: SiteContent["testimonials"];
  theme: SiteTheme;
}) {
  const first = content.items[0];
  if (!first) return null;
  const style = sectionStyle(theme, "testimonials");
  return (
    <section id="quote" data-section="testimonials" style={style} className="bg-surface text-center">
      <SiteWrap className="max-w-[46rem]">
        <blockquote
          data-element-key="testimonials.items[0].quote"
          className="m-0 font-heading text-[clamp(1.4rem,3.5vw,2rem)] font-bold leading-snug text-ink"
        >
          &ldquo;{first.quote}&rdquo;
        </blockquote>
        <cite
          data-element-key="testimonials.items[0].name"
          className="mt-6 block not-italic text-sm font-bold uppercase tracking-wide text-muted"
        >
          — {first.name}
        </cite>
      </SiteWrap>
    </section>
  );
}

export function VisitSection({
  content,
  theme,
}: {
  content: SiteContent["contact"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "contact");
  const rows: { key: string; label: string; value: string }[] = [
    { key: "contact.address", label: "Find us", value: content.address },
    { key: "contact.hours", label: "Hours", value: content.hours },
    { key: "contact.phone", label: "Call", value: content.phone },
    { key: "contact.email", label: "Email", value: content.email },
  ];
  return (
    <section id="visit" data-section="contact" style={style} className="bg-bg">
      <SiteWrap>
        <SectionTitle elementKey="contact.section_title">{content.section_title}</SectionTitle>
        <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.key}>
              <dt className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted">
                {row.label}
              </dt>
              <dd data-element-key={row.key} className="m-0 font-heading text-lg text-ink">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </SiteWrap>
    </section>
  );
}

export function GalleryGrid({
  content,
  theme,
}: {
  content: SiteContent["gallery"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "gallery");
  return (
    <section id="gallery" data-section="gallery" style={style} className="bg-bg">
      <SiteWrap>
        <SectionTitle elementKey="gallery.section_title">{content.section_title}</SectionTitle>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
          {content.items.map((item, i) => (
            <li key={i} className="relative overflow-hidden rounded-site">
              <div className="aspect-square">
                <SlotImage slot={`gallery.items[${i}].image`} src={item.image} alt={item.caption} />
              </div>
              {item.caption ? (
                <span
                  data-element-key={`gallery.items[${i}].caption`}
                  className="absolute inset-x-0 bottom-0 bg-ink/60 px-3 py-2 text-xs text-on-dark"
                >
                  {item.caption}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </SiteWrap>
    </section>
  );
}

export function PricingCards({
  content,
  theme,
}: {
  content: SiteContent["pricing"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "pricing");
  return (
    <section id="pricing" data-section="pricing" style={style} className="bg-surface">
      <SiteWrap>
        <SectionTitle elementKey="pricing.section_title">{content.section_title}</SectionTitle>
        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item, i) => (
            <li key={i} className="flex flex-col rounded-site border border-line bg-bg p-6">
              <h3
                data-element-key={`pricing.items[${i}].name`}
                className="mb-1 font-heading text-lg font-bold text-ink"
              >
                {item.name}
              </h3>
              <p
                data-element-key={`pricing.items[${i}].price`}
                className="mb-4 font-heading text-2xl font-extrabold text-accent"
              >
                {item.price}
              </p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-muted">
                {(item.features ?? []).map((f, j) => (
                  <li
                    key={j}
                    data-element-key={`pricing.items[${i}].features[${j}]`}
                    className="flex gap-2"
                  >
                    <span className="text-accent">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </SiteWrap>
    </section>
  );
}

export function FaqAccordion({
  content,
  theme,
}: {
  content: SiteContent["faq"];
  theme: SiteTheme;
}) {
  const style = sectionStyle(theme, "faq");
  return (
    <section id="faq" data-section="faq" style={style} className="bg-bg">
      <SiteWrap className="max-w-[46rem]">
        <SectionTitle elementKey="faq.section_title">{content.section_title}</SectionTitle>
        <div className="flex flex-col gap-3">
          {content.items.map((item, i) => (
            <details key={i} className="rounded-site border border-line bg-surface px-5 py-4">
              <summary
                data-element-key={`faq.items[${i}].q`}
                className="cursor-pointer font-heading font-bold text-ink"
              >
                {item.q}
              </summary>
              <p
                data-element-key={`faq.items[${i}].a`}
                className="m-0 mt-3 text-sm leading-relaxed text-muted"
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </SiteWrap>
    </section>
  );
}

export function HeroCentered({
  content,
  theme,
  eyebrow,
}: {
  content: SiteContent["hero"];
  theme: SiteTheme;
  eyebrow: string;
}) {
  const style = sectionStyle(theme, "hero");
  return (
    <section id="hero" data-section="hero" style={style} className="bg-bg text-center">
      <SiteWrap className="flex max-w-[52rem] flex-col items-center pt-16 pb-12 sm:pt-20 sm:pb-16">
        <p className="mb-5 text-[0.78rem] font-bold uppercase tracking-[0.18em] text-kicker">{eyebrow}</p>
        <h1
          data-element-key="hero.headline"
          className="mb-5 font-heading text-[clamp(2rem,5.5vw,3.5rem)] font-extrabold leading-[1.08] text-ink"
        >
          {content.headline}
        </h1>
        <p
          data-element-key="hero.subtext"
          className="mb-8 max-w-[44ch] text-[1.05rem] leading-relaxed text-muted"
        >
          {content.subtext}
        </p>
        <CtaButton elementKey="hero.cta_button" theme={theme}>
          {content.cta_text}
        </CtaButton>
        {content.image ? (
          <figure className="mt-12 w-full overflow-hidden rounded-site">
            <div className="aspect-[16/9]">
              <SlotImage slot="hero.background" src={content.image} alt="" eager />
            </div>
          </figure>
        ) : null}
      </SiteWrap>
    </section>
  );
}
