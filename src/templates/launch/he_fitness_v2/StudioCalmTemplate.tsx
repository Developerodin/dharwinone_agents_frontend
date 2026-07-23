import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { LaunchTemplateProps } from "../registry";
import type { SectionKey, SiteContent, SiteTheme } from "../../system/types";
import { phoneToWhatsAppHref } from "@/lib/site-config";
import { FAMILIES } from "../../families";
import { templateFontClasses } from "../../fonts";
import { visibleSections } from "../../system/applyTheme";
import { CtaButton, SiteRoot, SlotImage, TextLogo } from "../shared/primitives";

// warm_craft = Young Serif headings + Karla body + 1rem radius + warm paper
// palette. Matches the "Studio Calm" source (fitness-3.html) exactly, including
// its Karla body font.
const FAMILY = FAMILIES.warm_craft;

const WRAP = "mx-auto w-full max-w-[1140px] px-5";

// ponytail: the breathing-paced class rhythm is the signature of this design —
// a fixed weekly showcase, not per-business data (no content field models the
// intensity dots / teacher shape). Hardcoded as design furniture, pinned to
// follow `services`. Upgrade path: a `schedule` content field + schema entry.
const RHYTHM: { name: string; dur: string; dots: number; tag: string; who: string; cred: string }[] = [
  { name: "Morning Slow Flow", dur: "60 min · Mon, Wed, Fri 7:30", dots: 2, tag: "gentle", who: "Amara Lindqvist", cred: "vinyasa, 500h" },
  { name: "Reformer Pilates Foundations", dur: "50 min · Tue, Thu 9:00 & 18:00", dots: 3, tag: "steady", who: "Elena Barros", cred: "STOTT certified" },
  { name: "Strong Slow Vinyasa", dur: "75 min · Tue, Sat 10:30", dots: 4, tag: "strong", who: "Jonas Feld", cred: "ashtanga background" },
  { name: "Lunch Reset", dur: "40 min · every weekday 12:15", dots: 1, tag: "restful", who: "Rotating teachers", cred: "breath & mobility" },
  { name: "Evening Yin & Sound", dur: "75 min · Sun 19:00", dots: 1, tag: "restful", who: "Amara Lindqvist", cred: "with live cello" },
];

const ACCENT: CSSProperties = { backgroundColor: "var(--site-accent)" };

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-accent">
      {children}
    </p>
  );
}

function Heading({
  elementKey,
  children,
  className = "",
}: {
  elementKey?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      data-element-key={elementKey}
      className={`font-heading font-normal leading-[1.15] text-ink ${className}`}
    >
      {children}
    </h2>
  );
}

/** Italicise the final word of a headline, à la the original serif `<em>`. */
function AccentEm({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <>{text}</>;
  const head = words.slice(0, -2).join(" ");
  const tail = words.slice(-2).join(" ");
  return (
    <>
      {head ? `${head} ` : ""}
      <em className="italic text-accent">{tail}</em>
    </>
  );
}

/** Soft asymmetric "blob" frame — the organic shape language of this design. */
function OrganicFrame({
  radius,
  className = "",
  children,
}: {
  radius: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`overflow-hidden border border-line ${className}`} style={{ borderRadius: radius }}>
      {children}
    </div>
  );
}

/**
 * Faithful React port of fitness-3.html ("Studio Calm" yoga/pilates studio).
 * Bespoke launch template — warm serif voice, organic shapes, breathing-paced
 * class rhythm. Themeable via SiteTheme tokens; content-driven where a content
 * field exists, reorderable/hideable via visibleSections + sectionMap.
 */
export function StudioCalmTemplate({ content, theme, brandName }: LaunchTemplateProps) {
  if (!content || !theme) return null;
  const c: SiteContent = content;
  const t: SiteTheme = theme;
  const brand = brandName ?? c.seo?.title?.split("—")[0]?.trim() ?? "Your Studio";

  const cards = c.services.items.slice(0, 3);
  const plans = c.pricing.items.slice(0, 3);
  const steps = c.why_us.points.slice(0, 3);
  const stepWords = ["one", "two", "three", "four", "five"];
  const whatsappHref = phoneToWhatsAppHref(c.contact.phone);
  const ctaIsWhatsApp = /whatsapp/i.test(c.cta_footer.cta_text ?? "");
  const footerCtaHref = ctaIsWhatsApp && whatsappHref ? whatsappHref : "#visit";
  const telHref = `tel:${c.contact.phone.replace(/\s/g, "")}`;

  // Reorderable content sections keyed by SectionKey, rendered in theme order.
  const sectionMap: Partial<Record<SectionKey, ReactNode>> = {
    hero: (
      <section id="hero" data-section="hero" className="py-20 md:py-28">
        <div className={`${WRAP} grid items-center gap-12 md:grid-cols-2`}>
          <div>
            <Eyebrow>Small rooms · slow hours</Eyebrow>
            <h1
              data-element-key="hero.headline"
              className="font-heading font-normal leading-[1.06] text-ink text-[clamp(2.7rem,5.6vw,4.6rem)]"
            >
              <AccentEm text={c.hero.headline} />
            </h1>
            <p data-element-key="hero.subtext" className="mt-5 max-w-[46ch] text-[1.2rem] text-muted">
              {c.hero.subtext}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <CtaButton elementKey="hero.cta_button" theme={t} href="#visit">
                {c.hero.cta_text}
              </CtaButton>
              <CtaButton elementKey="hero.cta_secondary" theme={t} ghost href="#rhythm">
                See the week
              </CtaButton>
            </div>
          </div>
          <OrganicFrame radius="58% 42% 46% 54% / 48% 44% 56% 52%" className="h-[340px] md:h-[480px]">
            <SlotImage
              slot="hero.image"
              src={c.hero.image}
              alt={`${brand} studio`}
              eager
              className="h-full w-full"
            />
          </OrganicFrame>
        </div>
      </section>
    ),
    services: (
      <section id="services" data-section="services" className="border-y border-line bg-surface py-20 md:py-24">
        <div className={WRAP}>
          <Eyebrow>Our approach</Eyebrow>
          <Heading elementKey="services.section_title" className="mb-3 max-w-[20ch] text-[clamp(2rem,3.6vw,3rem)]">
            {c.services.section_title}
          </Heading>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {cards.map((card, i) => (
              <div key={i} className="h-full rounded-[28px] border border-line bg-bg p-7">
                <div
                  className="mb-5 h-11 w-11"
                  style={{ ...ACCENT, opacity: 0.85, borderRadius: ["50% 50% 50% 4px", "4px 50% 50% 50%", "50% 4px 50% 50%"][i % 3] }}
                  aria-hidden
                />
                <h3 data-element-key={`services.items[${i}].title`} className="font-heading text-[1.4rem] font-normal text-ink">
                  {card.title}
                </h3>
                <p data-element-key={`services.items[${i}].desc`} className="mt-2 mb-0 text-[0.97rem] text-muted">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
    about: (
      <section id="about" data-section="about" className="py-20 md:py-24">
        <div className={`${WRAP} grid items-center gap-12 md:grid-cols-[5fr_7fr]`}>
          <OrganicFrame radius="46% 54% 40% 60% / 55% 45% 55% 45%" className="h-[360px] md:h-[440px]">
            <SlotImage slot="about.image" src={c.about.image} alt={`Inside ${brand}`} className="h-full w-full" />
          </OrganicFrame>
          <div>
            <Eyebrow>The studio</Eyebrow>
            <Heading elementKey="about.section_title" className="mb-4 max-w-[20ch] text-[clamp(2rem,3.6vw,3rem)]">
              {c.about.section_title}
            </Heading>
            <p data-element-key="about.body" className="text-[1.05rem] text-muted">
              {c.about.body}
            </p>
          </div>
        </div>
      </section>
    ),
    why_us: (
      <section id="visit" data-section="why_us" className="border-y border-line bg-surface py-20 md:py-24">
        <div className={WRAP}>
          <Eyebrow>Your first visit</Eyebrow>
          <Heading elementKey="why_us.section_title" className="mb-8 max-w-[18ch] text-[clamp(2rem,3.6vw,3rem)]">
            {c.why_us.section_title}
          </Heading>
          <div className="max-w-[720px]">
            {steps.map((point, i) => (
              <div key={i} className="grid grid-cols-[56px_1fr] items-baseline gap-5 border-t border-line py-6">
                <span className="font-heading text-[1.3rem] italic text-accent">{stepWords[i]}</span>
                <p data-element-key={`why_us.points[${i}]`} className="mb-0 text-[1.05rem] text-ink">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
    gallery: (
      <section id="gallery" data-section="gallery" className="py-20 md:py-24">
        <div className={WRAP}>
          <Eyebrow>A quiet courtyard</Eyebrow>
          <Heading elementKey="gallery.section_title" className="mb-8 max-w-[20ch] text-[clamp(2rem,3.6vw,3rem)]">
            {c.gallery.section_title}
          </Heading>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {c.gallery.items.map((tile, i) => (
              <figure key={i} className="m-0">
                <OrganicFrame
                  radius={i % 2 === 0 ? "2rem" : "46% 54% 40% 60% / 55% 45% 55% 45%"}
                  className="h-[280px]"
                >
                  <SlotImage slot={`gallery.items[${i}].image`} src={tile.image} alt={tile.caption} className="h-full w-full" />
                </OrganicFrame>
                <figcaption data-element-key={`gallery.items[${i}].caption`} className="mt-3 text-[0.9rem] text-muted">
                  {tile.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    ),
    testimonials: (
      <section id="testimonials" data-section="testimonials" className="border-y border-line bg-surface py-20 md:py-24">
        <div className={WRAP}>
          <Eyebrow>In their words</Eyebrow>
          <Heading elementKey="testimonials.section_title" className="mb-8 text-[clamp(2rem,3.6vw,3rem)]">
            {c.testimonials.section_title}
          </Heading>
          <div className="grid gap-6 md:grid-cols-2">
            {c.testimonials.items.map((item, i) => (
              <blockquote key={i} className="m-0 rounded-[28px] border border-line bg-bg p-8">
                <span aria-hidden className="font-heading text-[3rem] leading-[0.6] text-accent">“</span>
                <p data-element-key={`testimonials.items[${i}].quote`} className="mb-4 mt-2 text-[1.05rem] text-ink">
                  {item.quote}
                </p>
                <footer data-element-key={`testimonials.items[${i}].name`} className="text-[0.85rem] font-semibold uppercase tracking-[0.12em] text-accent">
                  {item.name}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    ),
    pricing: (
      <section id="pricing" data-section="pricing" className="py-20 md:py-24">
        <div className={WRAP}>
          <Eyebrow>Simple pricing</Eyebrow>
          <Heading elementKey="pricing.section_title" className="mb-8 text-[clamp(2rem,3.6vw,3rem)]">
            {c.pricing.section_title}
          </Heading>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => {
              const featured = i === 1;
              return (
                <div
                  key={i}
                  className={`h-full rounded-[28px] border p-8 ${featured ? "border-accent bg-surface" : "border-line bg-bg"}`}
                >
                  <h3 data-element-key={`pricing.items[${i}].name`} className="font-heading text-[1.5rem] font-normal text-ink">
                    {plan.name}
                  </h3>
                  <div data-element-key={`pricing.items[${i}].price`} className="my-3 font-heading text-[2rem] font-normal text-ink">
                    {plan.price}
                  </div>
                  <ul className="mb-6 list-none space-y-2 p-0 text-[0.95rem] text-muted">
                    {plan.features.map((f, j) => (
                      <li key={j} data-element-key={`pricing.items[${i}].features[${j}]`} className="border-b border-line pb-2 last:border-b-0">
                        {f}
                      </li>
                    ))}
                  </ul>
                  <CtaButton elementKey={`plan.${i}.cta`} theme={t} ghost={!featured} href="#visit">
                    Choose {plan.name}
                  </CtaButton>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
    faq: (
      <section id="faq" data-section="faq" className="border-y border-line bg-surface py-20 md:py-24">
        <div className={`${WRAP} grid gap-10 md:grid-cols-[4fr_8fr]`}>
          <div>
            <Eyebrow>Common questions</Eyebrow>
            <Heading elementKey="faq.section_title" className="text-[clamp(2rem,3.6vw,3rem)]">
              {c.faq.section_title}
            </Heading>
          </div>
          <div>
            {c.faq.items.map((item, i) => (
              <details key={i} open={i === 0} className="border-b border-line">
                <summary data-element-key={`faq.items[${i}].q`} className="cursor-pointer list-none py-4 text-[1.1rem] font-semibold text-ink">
                  {item.q}
                </summary>
                <p data-element-key={`faq.items[${i}].a`} className="mb-4 mt-0 text-[0.95rem] text-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    ),
    contact: (
      <section id="contact" data-section="contact" className="py-20 md:py-24">
        <div className={WRAP}>
          <Eyebrow>Visit or call</Eyebrow>
          <Heading elementKey="contact.section_title" className="mb-8 text-[clamp(2rem,3.6vw,3rem)]">
            {c.contact.section_title}
          </Heading>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-accent">Visit</p>
              <p data-element-key="contact.address" className="mb-1 text-muted">{c.contact.address}</p>
              <p data-element-key="contact.hours" className="mb-0 text-muted">{c.contact.hours}</p>
            </div>
            <div>
              <p className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-accent">Reach us</p>
              <p className="mb-1 text-muted">
                <a data-element-key="contact.phone" href={telHref} className="text-accent">{c.contact.phone}</a>
              </p>
              {c.contact.email ? (
                <p className="mb-0 text-muted">
                  <a data-element-key="contact.email" href={`mailto:${c.contact.email}`} className="text-accent">
                    {c.contact.email}
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    ),
    cta_footer: (
      <section id="cta_footer" data-section="cta_footer" className="border-t border-line bg-surface py-24 text-center">
        <div className={WRAP}>
          <Heading elementKey="cta_footer.headline" className="mx-auto max-w-[24ch] text-[clamp(2.2rem,4.5vw,3.4rem)]">
            <AccentEm text={c.cta_footer.headline} />
          </Heading>
          <p className="mx-auto mt-3 max-w-[44ch] text-muted">
            The mat is ready and the room is quiet. Come at the pace that suits you — the first class is on us.
          </p>
          <div className="mt-6 flex justify-center">
            <CtaButton elementKey="cta.button" theme={t} href={footerCtaHref}>
              {c.cta_footer.cta_text}
            </CtaButton>
          </div>
        </div>
      </section>
    ),
  };

  // ponytail: rhythm is fixed showcase furniture (no section key). Pinned to
  // follow services so the default look is unchanged; travels/hides with it.
  const rhythm = (
    <section id="rhythm" className={`${WRAP} py-20 md:py-24`}>
      <Eyebrow>The weekly rhythm</Eyebrow>
      <Heading className="mb-3 max-w-[22ch] text-[clamp(2rem,3.6vw,3rem)]">
        Classes, paced like a long exhale
      </Heading>
      <p className="mb-8 max-w-[62ch] text-muted">
        Intensity is marked in dots, one gentle to four strong. A mat is held for you until five minutes past.
      </p>
      <div className="space-y-4">
        {RHYTHM.map((row) => (
          <div
            key={row.name}
            className="grid gap-4 rounded-[28px] border border-line bg-bg px-7 py-5 md:grid-cols-[2fr_1.2fr_1.2fr_1.2fr] md:items-center md:rounded-full md:px-9"
          >
            <h3 className="m-0 font-heading text-[1.4rem] font-normal text-ink">{row.name}</h3>
            <div className="text-[0.95rem] text-muted">{row.dur}</div>
            <div className="flex items-center gap-2" aria-label={`Intensity ${row.dots} of 4`}>
              {[0, 1, 2, 3].map((d) => (
                <span
                  key={d}
                  className="block h-3 w-3 rounded-full border"
                  style={d < row.dots ? { ...ACCENT, borderColor: "var(--site-accent)" } : { borderColor: "var(--site-accent)" }}
                />
              ))}
              <span className="ml-1 text-[0.8rem] uppercase tracking-[0.06em] text-muted">{row.tag}</span>
            </div>
            <div className="text-[0.95rem] text-muted md:text-right">
              <b className="block font-semibold text-ink">{row.who}</b>
              {row.cred}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className={templateFontClasses}>
      <SiteRoot theme={t} family={FAMILY} templateId="he_fitness_v2">
        {/* nav */}
        <header className="border-b border-line py-4">
          <div className={`${WRAP} flex items-center justify-between gap-4`}>
            <TextLogo name={brand} />
            <nav className="hidden items-center gap-6 md:flex">
              <a href="#services" className="text-[0.92rem] font-medium text-muted hover:text-ink">Approach</a>
              <a href="#rhythm" className="text-[0.92rem] font-medium text-muted hover:text-ink">Classes</a>
              <a href="#gallery" className="text-[0.92rem] font-medium text-muted hover:text-ink">The studio</a>
              <a href="#pricing" className="text-[0.92rem] font-medium text-muted hover:text-ink">Pricing</a>
              <a href="#contact" className="text-[0.92rem] font-medium text-muted hover:text-ink">Contact</a>
            </nav>
            <CtaButton elementKey="header.cta_button" theme={t} href="#visit" className="!px-5 !py-2.5">
              {c.hero.cta_text}
            </CtaButton>
          </div>
        </header>

        <main>
          {visibleSections(t).map((key) => (
            <Fragment key={key}>
              {sectionMap[key]}
              {key === "services" ? rhythm : null}
            </Fragment>
          ))}
        </main>

        {/* footer */}
        <footer className="border-t border-line py-10 text-[0.92rem] text-muted">
          <div className={`${WRAP} flex flex-wrap items-center justify-between gap-3`}>
            <TextLogo name={brand} />
            <div className="flex gap-6">
              <a href="#rhythm" className="text-muted hover:text-ink">Classes</a>
              <a href="#gallery" className="text-muted hover:text-ink">Studio</a>
              <a href="#pricing" className="text-muted hover:text-ink">Pricing</a>
              <a href="#contact" className="text-muted hover:text-ink">Contact</a>
            </div>
          </div>
        </footer>
      </SiteRoot>
    </div>
  );
}
