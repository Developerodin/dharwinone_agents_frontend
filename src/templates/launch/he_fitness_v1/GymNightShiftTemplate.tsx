import type { LaunchTemplateProps } from "../registry";
import type { SiteContent, SiteTheme } from "../../system/types";
import { phoneToWhatsAppHref } from "@/lib/site-config";
import { FAMILIES } from "../../families";
import { templateFontClasses } from "../../fonts";
import { CtaButton, SiteRoot, SlotImage, TextLogo } from "../shared/primitives";

const FAMILY = FAMILIES.bold_convert;

// ponytail: the 24h clock rail is the signature of the "Night Shift" design —
// a fixed weekly rhythm, not per-business data. Hardcoded as design furniture.
// Upgrade path: add a `schedule` content field + section_schema entry if the
// editor ever needs to change hours.
const CLOCK: { hr: string; blk: string; hot?: boolean }[] = [
  { hr: "00:00", blk: "Open floor · quiet hours begin" },
  { hr: "01:00", blk: "Night shift strength block", hot: true },
  { hr: "02:00", blk: "Open floor · sled lanes free" },
  { hr: "03:00", blk: "Open floor · coach form checks" },
  { hr: "04:00", blk: "Early crew conditioning" },
  { hr: "05:00", blk: "First light lift · coached", hot: true },
  { hr: "06:00", blk: "Pre-work strength block" },
  { hr: "07:00", blk: "Open floor · busiest morning hour" },
  { hr: "08:00", blk: "Mobility and recovery room" },
  { hr: "09:00", blk: "Open floor" },
  { hr: "10:00", blk: "Small group strength · 6 spots" },
  { hr: "11:00", blk: "Open floor" },
  { hr: "12:00", blk: "Lunch break intervals · 45 min", hot: true },
  { hr: "13:00", blk: "Open floor" },
  { hr: "14:00", blk: "Open floor · quietest daytime hour" },
  { hr: "15:00", blk: "Athlete prep · school age, coached" },
  { hr: "16:00", blk: "Open floor" },
  { hr: "17:00", blk: "After work strength block", hot: true },
  { hr: "18:00", blk: "Conditioning · sled and rower" },
  { hr: "19:00", blk: "Open floor" },
  { hr: "20:00", blk: "Small group strength · 6 spots" },
  { hr: "21:00", blk: "Open floor · floor resets" },
  { hr: "22:00", blk: "Closers club · service industry", hot: true },
  { hr: "23:00", blk: "Open floor · lights drop low" },
];

// ponytail: coaches carry name/shift/bio/photo — no content field models that shape
// today. Hardcoded as showcase design content. Upgrade path: a `coaches` content
// field so generated sites swap in real staff.
const COACHES = [
  {
    name: "Renata Diaz",
    shift: "Nights · 12am to 6am",
    bio: "Twelve years coaching shift workers. Runs the 1am strength block and will not let you max out on no sleep.",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=70",
  },
  {
    name: "Marcus Oyelaran",
    shift: "Days · 6am to 2pm",
    bio: "Former rugby S&C. Owns the first light lift and the lunch intervals. Believes in heavy sleds and short meetings.",
    image:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=70",
  },
  {
    name: "Priya Sethi",
    shift: "Evenings · 2pm to 12am",
    bio: "Powerlifting coach, 83kg national qualifier. Runs the after work block and the closers club at ten.",
    image:
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=70",
  },
];

const CLOCK_IMAGE =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=70";

const WRAP = "mx-auto w-full max-w-[1140px] px-5";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[0.78rem] font-bold uppercase tracking-[0.22em] text-accent">
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
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      data-element-key={elementKey}
      className={`font-heading uppercase leading-[1.02] tracking-[0.01em] text-ink ${className}`}
    >
      {children}
    </h2>
  );
}

/** Colour the final word of a headline with the accent, à la the original coral span. */
function AccentTail({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <>{text}</>;
  const head = words.slice(0, -1).join(" ");
  const tail = words[words.length - 1];
  return (
    <>
      {head} <span className="text-accent">{tail}</span>
    </>
  );
}

/**
 * Faithful React port of fitness-2.html ("Night Shift" gym). Bespoke launch
 * template — signature 24h clock rail, coaches, membership tiers, dark palette.
 * Themeable via SiteTheme tokens; content-driven where a content field exists.
 */
export function GymNightShiftTemplate({ content, theme, brandName }: LaunchTemplateProps) {
  if (!content || !theme) return null;
  const c: SiteContent = content;
  const t: SiteTheme = theme;
  const brand = brandName ?? c.seo?.title?.split("—")[0]?.trim() ?? "Your Gym";

  const pillars = c.services.items.slice(0, 3);
  const plans = c.pricing.items.slice(0, 3);
  const whatsappHref = phoneToWhatsAppHref(c.contact.phone);
  const ctaIsWhatsApp = /whatsapp/i.test(c.cta_footer.cta_text ?? "");
  const footerCtaHref = ctaIsWhatsApp && whatsappHref ? whatsappHref : "#plans";
  const telHref = `tel:${c.contact.phone.replace(/\s/g, "")}`;

  return (
    <div className={templateFontClasses}>
      <SiteRoot theme={t} family={FAMILY} templateId="he_fitness_v1">
        {/* nav */}
        <header className="border-b border-line py-4">
          <div className={`${WRAP} flex items-center justify-between gap-4`}>
            <TextLogo name={brand} />
            <nav className="hidden items-center gap-6 md:flex">
              <a href="#gallery" className="text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink">
                24h clock
              </a>
              <a href="#plans" className="text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink">
                Membership
              </a>
              <a href="#coaches" className="text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink">
                Coaches
              </a>
              <a href="#contact" className="text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink">
                Contact
              </a>
            </nav>
            <CtaButton elementKey="header.cta_button" theme={t} href="#plans" className="!px-5 !py-2.5">
              {c.hero.cta_text}
            </CtaButton>
          </div>
        </header>

        <main>
          {/* hero */}
          <section id="hero" data-section="hero" className="border-b border-line py-16 md:py-24">
            <div className={`${WRAP} grid items-center gap-10 md:grid-cols-[7fr_5fr]`}>
              <div>
                <p className="mb-5 font-heading uppercase tracking-[0.28em] text-muted text-[0.95rem]">
                  Doors never lock · 365 nights a year
                </p>
                <h1
                  data-element-key="hero.headline"
                  className="font-heading uppercase leading-[0.94] text-ink text-[clamp(3rem,9vw,7rem)]"
                >
                  <AccentTail text={c.hero.headline} />
                </h1>
                <p data-element-key="hero.subtext" className="mt-6 max-w-[46ch] text-[1.15rem] text-muted">
                  {c.hero.subtext}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <CtaButton elementKey="hero.cta_button" theme={t} href="#plans">
                    {c.hero.cta_text}
                  </CtaButton>
                  <CtaButton elementKey="hero.cta_secondary" theme={t} ghost href="#gallery">
                    See the 24h clock
                  </CtaButton>
                </div>
              </div>
              <div className="aspect-[4/5] w-full overflow-hidden border border-line">
                <SlotImage
                  slot="hero.image"
                  src={c.hero.image}
                  alt={`${brand} training floor at night`}
                  eager
                  className="h-full w-full"
                />
              </div>
            </div>
          </section>

          {/* the floor — pillars */}
          <section id="services" data-section="services" className={`${WRAP} py-20`}>
            <Eyebrow>The floor</Eyebrow>
            <Heading elementKey="services.section_title" className="mb-8 max-w-[16ch] text-[clamp(2rem,4.5vw,3.4rem)]">
              {c.services.section_title}
            </Heading>
            <div className="grid gap-0 md:grid-cols-3">
              {pillars.map((p, i) => (
                <div key={i} className="border-t border-line py-7 md:pr-8">
                  <h3 data-element-key={`services.items[${i}].title`} className="font-heading uppercase text-[1.5rem] text-ink">{p.title}</h3>
                  <p data-element-key={`services.items[${i}].desc`} className="mt-2 mb-0 text-[0.98rem] text-muted">{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* signature — 24h clock rail (gallery slot for editor contract) */}
          <section id="gallery" data-section="gallery" className="border-y border-line bg-surface">
            <div className="grid md:grid-cols-[minmax(300px,420px)_1fr]">
              <div
                className="border-line md:border-r"
                aria-label="Hour by hour training block schedule, open 24 hours"
              >
                {CLOCK.map((row) => (
                  <div
                    key={row.hr}
                    className="grid grid-cols-[84px_1fr] items-center gap-4 border-b border-line px-5 py-2.5 last:border-b-0 sm:grid-cols-[110px_1fr] sm:px-6"
                  >
                    <span
                      className={`font-heading text-[1.4rem] sm:text-[1.7rem] ${row.hot ? "text-accent" : "text-muted"}`}
                    >
                      {row.hr}
                    </span>
                    <span
                      className={`text-[0.9rem] font-semibold uppercase tracking-[0.07em] ${row.hot ? "text-ink" : "text-muted"}`}
                    >
                      {row.blk}
                    </span>
                  </div>
                ))}
              </div>
              <div className="self-center px-6 py-12 md:px-12 md:py-16">
                <Eyebrow>Open 24 hours</Eyebrow>
                <Heading className="mb-3 max-w-[14ch] text-[clamp(2rem,4vw,3rem)]">
                  Pick your hour. It is on the board.
                </Heading>
                <p className="max-w-[62ch] text-muted">
                  The rail on the edge of this section is the actual weekly rhythm of the floor.
                  Coral hours are coached blocks included in every membership. Everything else is
                  open floor, and the door works the same at 2pm and 2am.
                </p>
                <p className="mt-3 max-w-[62ch] text-muted">
                  Quiet hours run midnight to five: music low, chalk allowed, no drop-in tours.
                </p>
                <div className="mt-8 h-[280px] w-full overflow-hidden border border-line">
                  <SlotImage
                    slot="clock.image"
                    src={CLOCK_IMAGE}
                    alt="Athlete resting between sets in a dark gym"
                    className="h-full w-full"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* membership */}
          <section id="plans" data-section="pricing" className={`${WRAP} py-24`}>
            <Eyebrow>Membership</Eyebrow>
            <Heading elementKey="pricing.section_title" className="mb-8 text-[clamp(2rem,4.5vw,3.4rem)]">
              {c.pricing.section_title}
            </Heading>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan, i) => {
                const hot = i === 1;
                return (
                  <div
                    key={i}
                    className={`h-full border p-7 ${hot ? "border-accent bg-surface" : "border-line bg-bg"}`}
                  >
                    <h3 data-element-key={`pricing.items[${i}].name`} className="font-heading uppercase text-[1.6rem] text-ink">{plan.name}</h3>
                    <div data-element-key={`pricing.items[${i}].price`} className="my-3 font-heading text-[2.4rem] text-ink">{plan.price}</div>
                    <ul className="mb-6 list-disc pl-5 text-[0.95rem] text-muted">
                      {plan.features.map((f, j) => (
                        <li key={j} data-element-key={`pricing.items[${i}].features[${j}]`}>{f}</li>
                      ))}
                    </ul>
                    <CtaButton
                      elementKey={`plan.${i}.cta`}
                      theme={t}
                      ghost={!hot}
                      href="#contact"
                    >
                      Choose {plan.name}
                    </CtaButton>
                  </div>
                );
              })}
            </div>
          </section>

          {/* coaches */}
          <section id="coaches" className={`${WRAP} pb-24`}>
            <Eyebrow>Coaches on shift</Eyebrow>
            <Heading className="mb-8 text-[clamp(2rem,4.5vw,3.4rem)]">
              Someone is always on the floor
            </Heading>
            <div className="grid gap-4 md:grid-cols-3">
              {COACHES.map((coach, i) => (
                <div key={i}>
                  <div className="h-[330px] w-full overflow-hidden border border-line">
                    <SlotImage
                      slot={`coaches.${i}.image`}
                      src={coach.image}
                      alt={coach.name}
                      className="h-full w-full"
                    />
                  </div>
                  <h3 className="mt-4 font-heading uppercase text-[1.35rem] text-ink">{coach.name}</h3>
                  <p className="text-[0.8rem] font-bold uppercase tracking-[0.16em] text-accent">
                    {coach.shift}
                  </p>
                  <p className="mt-1 text-[0.94rem] text-muted">{coach.bio}</p>
                </div>
              ))}
            </div>
          </section>

          {/* faq */}
          <section id="faq" data-section="faq" className="border-t border-line bg-surface py-24">
            <div className={`${WRAP} grid gap-10 md:grid-cols-[4fr_8fr]`}>
              <div>
                <Eyebrow>Common questions</Eyebrow>
                <Heading elementKey="faq.section_title" className="text-[clamp(2rem,4vw,3rem)]">{c.faq.section_title}</Heading>
              </div>
              <div>
                {c.faq.items.map((item, i) => (
                  <details key={i} open={i === 0} className="border-b border-line">
                    <summary data-element-key={`faq.items[${i}].q`} className="cursor-pointer list-none py-4 text-[1.2rem] font-bold text-ink">
                      {item.q}
                    </summary>
                    <p data-element-key={`faq.items[${i}].a`} className="mb-4 mt-0 text-[0.95rem] text-muted">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* contact */}
          <section id="contact" data-section="contact" className="border-t border-line py-24">
            <div className={WRAP}>
              <Eyebrow>Visit or Call</Eyebrow>
              <Heading elementKey="contact.section_title" className="mb-8 text-[clamp(2rem,4.5vw,3.4rem)]">
                {c.contact.section_title}
              </Heading>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-[0.8rem] font-bold uppercase tracking-[0.16em] text-accent">Visit</p>
                  <p data-element-key="contact.address" className="mb-1 text-muted">{c.contact.address}</p>
                  <p data-element-key="contact.hours" className="mb-0 text-muted">{c.contact.hours}</p>
                </div>
                <div>
                  <p className="text-[0.8rem] font-bold uppercase tracking-[0.16em] text-accent">Reach us</p>
                  <p className="mb-1 text-muted">
                    <a data-element-key="contact.phone" href={telHref} className="text-accent">
                      {c.contact.phone}
                    </a>
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

          {/* cta band */}
          <section id="cta_footer" data-section="cta_footer" className="border-t border-line bg-surface py-24 text-center">
            <div className={WRAP}>
              <Eyebrow>First session free</Eyebrow>
              <Heading elementKey="cta_footer.headline" className="mx-auto text-[clamp(2.4rem,6vw,4.4rem)]">
                {c.cta_footer.headline}
              </Heading>
              <p className="mx-auto mt-3 max-w-[48ch] text-muted">
                Walk in at any hour, tonight if you want. The desk is staffed, the coach is on the
                floor, and the first session costs nothing.
              </p>
              <div className="mt-6 flex justify-center">
                <CtaButton elementKey="cta.button" theme={t} href={footerCtaHref}>
                  {c.cta_footer.cta_text}
                </CtaButton>
              </div>
            </div>
          </section>
        </main>

        {/* footer */}
        <footer className="border-t border-line py-10 text-[0.92rem] text-muted">
          <div className={`${WRAP} flex flex-wrap items-center justify-between gap-3`}>
            <TextLogo name={brand} />
            <div className="flex gap-6">
              <a href="#gallery" className="text-muted hover:text-ink">24h clock</a>
              <a href="#plans" className="text-muted hover:text-ink">Membership</a>
              <a href="#coaches" className="text-muted hover:text-ink">Coaches</a>
              <a href="#contact" className="text-muted hover:text-ink">Find us</a>
            </div>
          </div>
        </footer>
      </SiteRoot>
    </div>
  );
}
