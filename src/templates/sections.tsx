import type { CSSProperties, ReactNode } from "react";
import type { FamilyConfig, SectionKey, SiteContent, SiteTheme } from "./system/types";
import { getElementStyle, getSectionStyle } from "./system/theme";

/**
 * The 10 standard sections (section-standard.json) + header/footer chrome.
 * Every template renders these same components; the family config switches layout
 * variants. Colors/fonts come ONLY from --site-* vars, so sections swap losslessly
 * within a family. Every editable node carries data-element-key.
 */

interface P<K extends keyof SiteContent> {
  c: NonNullable<SiteContent[K]>;
  theme: SiteTheme;
  family: FamilyConfig;
}

function sectionItems<T>(items: T[] | undefined): T[] {
  return Array.isArray(items) ? items : [];
}

const ink = { color: "var(--site-ink)" } as CSSProperties;
const muted = { color: "var(--site-muted)" } as CSSProperties;
const wrap: CSSProperties = { maxWidth: 1140, margin: "0 auto", width: "100%" };

function headingStyle(f: FamilyConfig, size: string): CSSProperties {
  return {
    fontFamily: "var(--site-font-heading)",
    fontWeight: f.headingWeight,
    fontSize: size,
    lineHeight: 1.08,
    textTransform: f.headingTransform ?? "none",
    letterSpacing: f.headingSpacing ?? "normal",
    textWrap: "balance",
  } as CSSProperties;
}

function SectionTitle({ k, text, family }: { k: string; text: string; family: FamilyConfig }) {
  return (
    <h2
      data-element-key={`${k}.section_title`}
      style={{ ...headingStyle(family, "clamp(1.6rem, 3vw, 2.3rem)"), ...ink, margin: "0 0 2.5rem" }}
    >
      {text}
    </h2>
  );
}

function Cta({ k, text, theme, ghost, style }: { k: string; text: string; theme: SiteTheme; ghost?: boolean; style?: CSSProperties }) {
  return (
    <a
      href={ghost ? "#gallery" : "#contact"}
      data-element-key={k}
      style={{
        display: "inline-block",
        backgroundColor: ghost ? "transparent" : "var(--site-accent)",
        color: ghost ? "inherit" : "var(--site-on-accent)",
        border: ghost ? "1.5px solid currentColor" : "1.5px solid var(--site-accent)",
        borderRadius: "var(--site-radius)",
        padding: "0.8rem 1.9rem",
        fontWeight: 700,
        fontSize: "0.95rem",
        letterSpacing: "0.03em",
        textDecoration: "none",
        ...style,
        ...getElementStyle(theme, k),
      }}
    >
      {text}
    </a>
  );
}

function Img({ slot, src, alt, style, eager }: { slot: string; src?: string; alt: string; style?: CSSProperties; eager?: boolean }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- theme-resolved template imagery
    return <img data-image-slot={slot} src={src} alt={alt} loading={eager ? "eager" : "lazy"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }} />;
  }
  return (
    <div
      data-image-slot={slot}
      aria-hidden
      style={{
        width: "100%",
        height: "100%",
        minHeight: 160,
        background: "linear-gradient(135deg, var(--site-primary-soft), var(--site-surface))",
        ...style,
      }}
    />
  );
}

/** Headline with the last two words in the primary color: the display move the originals use. */
function AccentHeadline({ text, family, size, onDark }: { text: string; family: FamilyConfig; size: string; onDark?: boolean }) {
  const words = text.split(" ");
  const cut = Math.max(1, words.length - 2);
  // over the dark scrim, primary can be an ink tone (bold_convert) — pick whichever of
  // primary/accent stays visible there
  const accentVar = onDark ? "var(--site-hero-accent)" : "var(--site-primary)";
  return (
    <h1 data-element-key="hero.headline" style={{ ...headingStyle(family, size), margin: "0 0 1.25rem" }}>
      {words.slice(0, cut).join(" ")}{" "}
      <span style={{ color: accentVar }}>{words.slice(cut).join(" ")}</span>
    </h1>
  );
}

const NAV_LINKS: { key: SectionKey; href: string; label: string }[] = [
  { key: "services", href: "#services", label: "Services" },
  { key: "about", href: "#about", label: "About" },
  { key: "pricing", href: "#pricing", label: "Pricing" },
  { key: "faq", href: "#faq", label: "FAQ" },
  { key: "contact", href: "#contact", label: "Contact" },
];

/* ---------------- header chrome ---------------- */
export function Header({ brand, cta, theme, visibleSections }: { brand: string; cta: string; theme: SiteTheme; visibleSections: SectionKey[] }) {
  // ponytail: no hamburger — a one-pager's nav is a nicety; on mobile brand + CTA suffice
  const show = new Set(visibleSections);
  const links = NAV_LINKS.filter((l) => show.has(l.key));
  const link: CSSProperties = { color: "inherit", textDecoration: "none", fontSize: "0.95rem", fontWeight: 600, padding: "0.75rem 0.4rem" };
  return (
    <header style={{ borderBottom: "1px solid var(--site-line)", padding: "0.6rem 1.25rem" }}>
      <div style={{ ...wrap, display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
        <span data-element-key="brand.name" style={{ fontFamily: "var(--site-font-body)", fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.01em", marginRight: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {brand}
        </span>
        {links.length > 0 && (
          <nav className="hidden md:flex" style={{ gap: "1rem", alignItems: "center" }} aria-label="Site">
            {links.map((l) => (
              <a key={l.key} href={l.href} style={link}>{l.label}</a>
            ))}
          </nav>
        )}
        <Cta k="header.cta_button" text={cta} theme={theme} style={{ padding: "0.7rem 1.2rem", flexShrink: 0 }} />
      </div>
    </header>
  );
}

/* ---------------- hero ---------------- */
export function Hero({ c, theme, family, eyebrow, chip }: P<"hero"> & { eyebrow: string; chip?: string }) {
  const base = getSectionStyle(theme, "hero");
  // on the page bg the kicker uses the AA-safe mixed tone; over the dark scrim it needs the on-dark accent
  const kicker = (
    <p style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: family.hero === "fullbleed" ? "var(--site-hero-accent)" : "var(--site-kicker)", margin: "0 0 1.25rem" }}>
      {eyebrow}
    </p>
  );
  const sub = (center: boolean) => (
    <p data-element-key="hero.subtext" style={{ color: "inherit", opacity: 0.85, fontSize: "1.15rem", lineHeight: 1.6, margin: "0 0 2rem", maxWidth: "44ch", ...(center ? { marginInline: "auto" } : {}) }}>
      {c.subtext}
    </p>
  );
  const ctas = (
    <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap" }}>
      <Cta k="hero.cta_button" text={c.cta_text} theme={theme} />
      <Cta k="hero.cta_secondary" text="See our work" theme={theme} ghost />
    </div>
  );

  if (family.hero === "fullbleed") {
    return (
      <section id="hero" data-section="hero" style={{ position: "relative", /* scrim guarantees a dark backdrop; scrim text is always light */ color: "#F7F5F0", backgroundColor: "#181613", ...base, padding: "0 1.25rem" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <Img slot="hero.background" src={c.image} alt="" eager style={{ minHeight: "100%" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(200deg, rgba(10,9,7,0.25) 0%, rgba(10,9,7,0.72) 78%)" }} />
        <div style={{ ...wrap, position: "relative", minHeight: "78vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "4.5rem", paddingTop: "7rem" }}>
          {kicker}
          <AccentHeadline text={c.headline} family={family} size="clamp(2.6rem, 7vw, 5rem)" onDark />
          {sub(false)}
          {ctas}
        </div>
      </section>
    );
  }

  if (family.hero === "split") {
    return (
      <section id="hero" data-section="hero" style={{ backgroundColor: "var(--site-bg)", ...ink, ...base, paddingTop: "5rem", paddingBottom: "4rem" }}>
        <div style={{ ...wrap, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", alignItems: "center" }}>
          <div>
            {kicker}
            <AccentHeadline text={c.headline} family={family} size="clamp(2.4rem, 5.5vw, 3.9rem)" />
            {sub(false)}
            {ctas}
          </div>
          <figure style={{ margin: 0, position: "relative", minHeight: 380 }}>
            <Img slot="hero.background" src={c.image} alt="" eager style={{ minHeight: 380, borderRadius: "var(--site-radius)" }} />
            {chip && (
              <figcaption style={{ position: "absolute", left: 0, bottom: "1.25rem", background: "var(--site-ink)", color: "var(--site-bg)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.55rem 1rem" }}>
                {chip}
              </figcaption>
            )}
          </figure>
        </div>
      </section>
    );
  }

  return (
    <section id="hero" data-section="hero" style={{ backgroundColor: "var(--site-surface)", ...ink, textAlign: "center", ...base, paddingTop: "5rem", paddingBottom: "0" }}>
      <div style={wrap}>
        {kicker}
        <AccentHeadline text={c.headline} family={family} size="clamp(2.4rem, 6vw, 4.2rem)" />
        {sub(true)}
        <div style={{ display: "flex", gap: "0.9rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Cta k="hero.cta_button" text={c.cta_text} theme={theme} />
          <Cta k="hero.cta_secondary" text="See our work" theme={theme} ghost />
        </div>
        <div style={{ marginTop: "3.5rem", height: 340, overflow: "hidden", borderRadius: "var(--site-radius) var(--site-radius) 0 0" }}>
          <Img slot="hero.background" src={c.image} alt="" eager style={{ minHeight: 340 }} />
        </div>
      </div>
    </section>
  );
}

/* ---------------- trust strip (why_us points, compact) ---------------- */
export function TrustStrip({ points }: { points: string[] }) {
  return (
    <div style={{ borderBlock: "1px solid var(--site-line)", backgroundColor: "var(--site-bg)", padding: "1.1rem 1.25rem" }}>
      <div style={{ ...wrap, display: "flex", gap: "2.5rem", flexWrap: "wrap", justifyContent: "space-between" }}>
        {points.slice(0, 3).map((p, i) => (
          <span key={i} style={{ ...ink, fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- services ---------------- */
export function Services({ c, theme, family }: P<"services">) {
  const items = sectionItems(c.items);
  if (!items.length) return null;

  const title = <SectionTitle k="services" text={c.section_title} family={family} />;

  if (family.services === "list") {
    return (
      <section id="services" data-section="services" style={{ backgroundColor: "var(--site-bg)", ...getSectionStyle(theme, "services"), paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
        <div style={wrap}>
          {title}
          <div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[minmax(180px,1fr)_2fr]" style={{ gap: "1rem 3rem", padding: "1.6rem 0", borderTop: "1px solid var(--site-line)" }}>
                <h3 data-element-key={`services.items[${i}].title`} style={{ ...headingStyle(family, "1.25rem"), ...ink, margin: 0 }}>{it.title}</h3>
                <p data-element-key={`services.items[${i}].desc`} style={{ ...muted, margin: 0, lineHeight: 1.65, maxWidth: "58ch" }}>{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (family.services === "tiles") {
    return (
      <section id="services" data-section="services" style={{ backgroundColor: "var(--site-surface)", ...getSectionStyle(theme, "services"), paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
        <div style={wrap}>
          {title}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0.75rem" }}>
            {items.map((it, i) => (
              <div key={i} style={{ backgroundColor: "var(--site-bg)", padding: "1.75rem 1.5rem", borderRadius: "var(--site-radius)" }}>
                <span aria-hidden style={{ display: "block", width: 34, height: 3, backgroundColor: "var(--site-accent)", marginBottom: "1.1rem" }} />
                <h3 data-element-key={`services.items[${i}].title`} style={{ ...headingStyle(family, "1.1rem"), ...ink, margin: "0 0 0.5rem" }}>{it.title}</h3>
                <p data-element-key={`services.items[${i}].desc`} style={{ ...muted, margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // cards: first item featured with image, rest compact — no identical-card grid
  const [first, ...rest] = items;
  return (
    <section id="services" data-section="services" style={{ backgroundColor: "var(--site-bg)", ...getSectionStyle(theme, "services"), paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
      <div style={wrap}>
        {title}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {first && (
            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 0, backgroundColor: "var(--site-surface)", borderRadius: "var(--site-radius)", overflow: "hidden" }}>
              <div style={{ minHeight: 260 }}>
                <Img slot="services.items[0].image" src={first.image} alt={first.title} style={{ minHeight: 260 }} />
              </div>
              <div style={{ padding: "2.25rem" }}>
                <h3 data-element-key="services.items[0].title" style={{ ...headingStyle(family, "1.5rem"), ...ink, margin: "0 0 0.75rem" }}>{first.title}</h3>
                <p data-element-key="services.items[0].desc" style={{ ...muted, margin: 0, lineHeight: 1.65 }}>{first.desc}</p>
              </div>
            </div>
          )}
          {rest.map((it, j) => {
            const i = j + 1;
            return (
              <div key={i} style={{ backgroundColor: "var(--site-surface)", borderRadius: "var(--site-radius)", padding: "1.75rem" }}>
                <h3 data-element-key={`services.items[${i}].title`} style={{ ...headingStyle(family, "1.15rem"), ...ink, margin: "0 0 0.5rem" }}>{it.title}</h3>
                <p data-element-key={`services.items[${i}].desc`} style={{ ...muted, margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>{it.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- about ---------------- */
export function About({ c, theme, family }: P<"about">) {
  return (
    <section id="about" data-section="about" style={{ backgroundColor: "var(--site-surface)", ...getSectionStyle(theme, "about"), paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
      <div style={{ ...wrap, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "3.5rem", alignItems: "center" }}>
        <div style={{ minHeight: 340 }}>
          <Img slot="about.image" src={c.image} alt="" style={{ minHeight: 340, borderRadius: "var(--site-radius)" }} />
        </div>
        <div>
          <SectionTitle k="about" text={c.section_title} family={family} />
          <p data-element-key="about.body" style={{ ...ink, maxWidth: "58ch", lineHeight: 1.75, fontSize: "1.05rem", margin: 0 }}>{c.body}</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- why_us ---------------- */
export function WhyUs({ c, theme, family }: P<"why_us">) {
  const points = sectionItems(c.points);
  if (!points.length) return null;

  return (
    <section id="why_us" data-section="why_us" style={{ backgroundColor: "var(--site-primary)", color: "var(--site-on-primary)", ...getSectionStyle(theme, "why_us"), paddingTop: "5rem", paddingBottom: "5rem" }}>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_2fr]" style={{ ...wrap, gap: "2rem 4rem" }}>
        <h2 data-element-key="why_us.section_title" style={{ ...headingStyle(family, "clamp(1.6rem, 3vw, 2.3rem)"), margin: 0 }}>
          {c.section_title}
        </h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {points.map((p, i) => (
            <li key={i} data-element-key={`why_us.points[${i}]`} style={{ display: "flex", gap: "1rem", alignItems: "baseline", padding: "1rem 0", borderTop: i ? "1px solid color-mix(in srgb, currentColor 25%, transparent)" : "none", fontWeight: 600, fontSize: "1.1rem" }}>
              <span aria-hidden style={{ color: "var(--site-accent)", fontWeight: 800 }}>✓</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- gallery ---------------- */
export function Gallery({ c, theme, family }: P<"gallery">) {
  const items = sectionItems(c.items);
  if (!items.length) return null;

  return (
    <section id="gallery" data-section="gallery" style={{ backgroundColor: "var(--site-bg)", ...getSectionStyle(theme, "gallery"), paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
      <div style={wrap}>
        <SectionTitle k="gallery" text={c.section_title} family={family} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gridAutoRows: "180px", gap: "0.75rem" }}>
          {items.map((it, i) => (
            <figure key={i} className={i === 0 ? "sm:col-span-2 sm:row-span-2" : undefined} style={{ margin: 0, overflow: "hidden", borderRadius: "var(--site-radius)", position: "relative" }}>
              <Img slot={`gallery.items[${i}].image`} src={it.image} alt={it.caption} style={{ minHeight: "100%", position: "absolute", inset: 0 }} />
              <figcaption data-element-key={`gallery.items[${i}].caption`} style={{ position: "absolute", left: 0, bottom: 0, background: "color-mix(in srgb, var(--site-ink) 82%, transparent)", color: "var(--site-bg)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.4rem 0.8rem" }}>
                {it.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- testimonials ---------------- */
export function Testimonials({ c, theme, family }: P<"testimonials">) {
  const items = sectionItems(c.items);
  if (!items.length) return null;

  const isCards = family.testimonials === "cards";
  return (
    <section id="testimonials" data-section="testimonials" style={{ backgroundColor: "var(--site-surface)", ...getSectionStyle(theme, "testimonials"), paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
      <div style={wrap}>
        <SectionTitle k="testimonials" text={c.section_title} family={family} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {items.map((t, i) => (
            <blockquote key={i} style={{ margin: 0, padding: isCards ? "2rem" : "0", backgroundColor: isCards ? "var(--site-bg)" : "transparent", borderRadius: "var(--site-radius)" }}>
              <span aria-hidden style={{ fontFamily: "var(--site-font-heading)", fontSize: "3rem", lineHeight: 0.6, color: "var(--site-accent)", display: "block", marginBottom: "1rem" }}>“</span>
              <p data-element-key={`testimonials.items[${i}].quote`} style={{ ...ink, fontSize: "1.1rem", lineHeight: 1.65, marginTop: 0 }}>
                {t.quote}
              </p>
              <footer style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1.25rem" }}>
                <span aria-hidden style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: "var(--site-primary)", color: "var(--site-on-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
                  {t.name.charAt(0)}
                </span>
                <span data-element-key={`testimonials.items[${i}].name`} style={{ ...muted, fontWeight: 700 }}>{t.name}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- pricing ---------------- */
export function Pricing({ c, theme, family }: P<"pricing">) {
  const items = sectionItems(c.items);
  if (!items.length) return null;

  const featured = Math.min(1, items.length - 1);
  return (
    <section id="pricing" data-section="pricing" style={{ backgroundColor: "var(--site-bg)", ...getSectionStyle(theme, "pricing"), paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
      <div style={wrap}>
        <SectionTitle k="pricing" text={c.section_title} family={family} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.25rem", alignItems: "stretch" }}>
          {items.map((p, i) => {
            const hot = i === featured;
            return (
              <div key={i} style={{ border: hot ? "2px solid var(--site-primary)" : "1px solid var(--site-line)", borderRadius: "var(--site-radius)", padding: "2rem", position: "relative", backgroundColor: hot ? "var(--site-primary-soft)" : "var(--site-bg)" }}>
                {hot && (
                  <span style={{ position: "absolute", top: "-0.8rem", left: "1.5rem", backgroundColor: "var(--site-primary)", color: "var(--site-on-primary)", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.3rem 0.8rem", borderRadius: "999px" }}>
                    Popular
                  </span>
                )}
                <h3 data-element-key={`pricing.items[${i}].name`} style={{ ...headingStyle(family, "1.1rem"), ...ink, margin: "0 0 0.75rem" }}>{p.name}</h3>
                <div data-element-key={`pricing.items[${i}].price`} style={{ ...headingStyle(family, "2.2rem"), color: "var(--site-primary)", margin: "0 0 1.25rem", fontVariantNumeric: "tabular-nums" }}>
                  {p.price}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.6rem" }}>
                  {sectionItems(p.features).map((f, j) => (
                    <li key={j} data-element-key={`pricing.items[${i}].features[${j}]`} style={{ ...muted, fontSize: "0.95rem", display: "flex", gap: "0.5rem" }}>
                      <span aria-hidden style={{ color: "var(--site-accent)", fontWeight: 800 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- faq ---------------- */
export function Faq({ c, theme, family }: P<"faq">) {
  const items = sectionItems(c.items);
  if (!items.length) return null;

  return (
    <section id="faq" data-section="faq" style={{ backgroundColor: "var(--site-surface)", ...getSectionStyle(theme, "faq"), paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
      <div style={{ ...wrap, maxWidth: 800 }}>
        <SectionTitle k="faq" text={c.section_title} family={family} />
        {items.map((f, i) => (
          <details key={i} style={{ borderTop: "1px solid var(--site-line)" }}>
            <summary data-element-key={`faq.items[${i}].q`} style={{ ...ink, fontWeight: 700, cursor: "pointer", fontSize: "1.05rem", padding: "1.1rem 0" /* ≥44px touch target */ }}>{f.q}</summary>
            <p data-element-key={`faq.items[${i}].a`} style={{ ...muted, margin: "0 0 1.1rem", lineHeight: 1.65, maxWidth: "65ch" }}>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ---------------- contact ---------------- */
function ContactPhone({ phone, size }: { phone: string; size?: CSSProperties["fontSize"] }) {
  return (
    <a
      href={`tel:${phone}`}
      data-element-key="contact.phone"
      style={{
        color: "var(--site-primary)",
        fontWeight: 700,
        fontSize: size ?? "1.05rem",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        minHeight: 44,
        padding: "0.35rem 0",
      }}
    >
      {phone}
    </a>
  );
}

function ContactEmail({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      data-element-key="contact.email"
      style={{
        color: "var(--site-primary)",
        fontWeight: 600,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        minHeight: 44,
        padding: "0.35rem 0",
      }}
    >
      {email}
    </a>
  );
}

function ContactAddress({ address }: { address: string }) {
  return (
    <p data-element-key="contact.address" style={{ ...ink, margin: 0, lineHeight: 1.6 }}>
      {address}
    </p>
  );
}

function ContactHours({ hours, style }: { hours: string; style?: CSSProperties }) {
  return (
    <p data-element-key="contact.hours" style={{ ...ink, margin: 0, lineHeight: 1.6, ...style }}>
      {hours}
    </p>
  );
}

export function Contact({ c, theme, family }: P<"contact">) {
  const base = getSectionStyle(theme, "contact");
  const title = <SectionTitle k="contact" text={c.section_title} family={family} />;

  // Scene: homeowner on phone at 9pm — number and hours first, map-adjacent details second.
  if (family.contact === "phone_first") {
    return (
      <section id="contact" data-section="contact" style={{ backgroundColor: "var(--site-bg)", ...base, paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
        <div style={wrap}>
          {title}
          <div style={{ backgroundColor: "var(--site-surface)", borderRadius: "var(--site-radius)", padding: "1.75rem 1.5rem", marginBottom: "2rem" }}>
            <p style={{ ...muted, margin: "0 0 0.35rem", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Call now</p>
            <ContactPhone phone={c.phone} size="clamp(1.6rem, 4vw, 2.4rem)" />
            <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--site-line)" }}>
              <p style={{ ...muted, margin: "0 0 0.35rem", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Hours</p>
              <ContactHours hours={c.hours} style={{ fontWeight: 700 }} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr]" style={{ gap: "2.5rem", alignItems: "stretch" }}>
            <div>
              <p style={{ ...muted, margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Visit</p>
              <ContactAddress address={c.address} />
              <p style={{ ...muted, margin: "1.5rem 0 0.35rem", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Email</p>
              <ContactEmail email={c.email} />
            </div>
            <div style={{ minHeight: 260, borderRadius: "var(--site-radius)", overflow: "hidden", border: "1px solid var(--site-line)" }} aria-label="Map area">
              <Img slot="contact.background" alt="" style={{ minHeight: 260 }} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Scene: driver needs a wash today — one high-contrast band, tap-to-call dominates.
  if (family.contact === "band_cta") {
    return (
      <section id="contact" data-section="contact" style={{ backgroundColor: "var(--site-primary)", color: "var(--site-on-primary)", ...base, padding: 0 }}>
        <div style={{ ...wrap, paddingTop: "4.5rem", paddingBottom: "4.5rem", textAlign: "center" }}>
          <h2
            data-element-key="contact.section_title"
            style={{ ...headingStyle(family, "clamp(1.4rem, 3vw, 2rem)"), margin: "0 0 1.5rem", color: "inherit" }}
          >
            {c.section_title}
          </h2>
          <a
            href={`tel:${c.phone}`}
            data-element-key="contact.phone"
            style={{
              display: "inline-block",
              backgroundColor: "var(--site-accent)",
              color: "var(--site-on-accent)",
              fontFamily: "var(--site-font-heading)",
              fontWeight: 800,
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              letterSpacing: "0.02em",
              textDecoration: "none",
              padding: "1rem 2rem",
              borderRadius: "var(--site-radius)",
              minHeight: 44,
              lineHeight: 1.1,
            }}
          >
            {c.phone}
          </a>
          <p data-element-key="contact.hours" style={{ margin: "1.5rem auto 0", maxWidth: "36ch", opacity: 0.9, fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {c.hours}
          </p>
          <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem 2.5rem", fontSize: "0.9rem", opacity: 0.85 }}>
            <span data-element-key="contact.address">{c.address}</span>
            <a href={`mailto:${c.email}`} data-element-key="contact.email" style={{ color: "inherit", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
              {c.email}
            </a>
          </div>
        </div>
      </section>
    );
  }

  // Scene: buyer vetting a broker — editorial columns, form-adjacent read-only fields.
  if (family.contact === "editorial") {
    const field = (label: string, child: ReactNode) => (
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{ ...muted, display: "block", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.45rem" }}>
          {label}
        </label>
        <div style={{ border: "1px solid var(--site-line)", borderRadius: "var(--site-radius)", padding: "0.85rem 1rem", backgroundColor: "var(--site-bg)", minHeight: 44, display: "flex", alignItems: "center" }}>
          {child}
        </div>
      </div>
    );
    return (
      <section id="contact" data-section="contact" style={{ backgroundColor: "var(--site-surface)", ...base, paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
        <div style={{ ...wrap, maxWidth: 960 }}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "3.5rem", alignItems: "start" }}>
            <div>
              {title}
              <ContactAddress address={c.address} />
            </div>
            <div>
              {field("Phone", <ContactPhone phone={c.phone} />)}
              {field("Email", <ContactEmail email={c.email} />)}
              {field("Hours", <ContactHours hours={c.hours} />)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Scene: luxury client on laptop — dark, quiet, generous space, no sales band.
  if (family.contact === "quiet_dark") {
    return (
      <section id="contact" data-section="contact" style={{ backgroundColor: "var(--site-ink)", color: "var(--site-bg)", ...base, paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
        <div style={{ ...wrap, maxWidth: 720, textAlign: "center" }}>
          <h2
            data-element-key="contact.section_title"
            style={{ ...headingStyle(family, "clamp(1.8rem, 4vw, 2.6rem)"), margin: "0 0 3.5rem", color: "inherit" }}
          >
            {c.section_title}
          </h2>
          <div style={{ display: "grid", gap: "2.5rem" }}>
            <div>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.65 }}>Telephone</p>
              <a href={`tel:${c.phone}`} data-element-key="contact.phone" style={{ color: "inherit", fontSize: "1.35rem", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
                {c.phone}
              </a>
            </div>
            <div style={{ height: 1, background: "color-mix(in srgb, currentColor 18%, transparent)" }} aria-hidden />
            <div>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.65 }}>Email</p>
              <a href={`mailto:${c.email}`} data-element-key="contact.email" style={{ color: "inherit", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
                {c.email}
              </a>
            </div>
            <div style={{ height: 1, background: "color-mix(in srgb, currentColor 18%, transparent)" }} aria-hidden />
            <div>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.65 }}>Address</p>
              <p data-element-key="contact.address" style={{ margin: 0, opacity: 0.9, lineHeight: 1.7 }}>{c.address}</p>
            </div>
            <div style={{ height: 1, background: "color-mix(in srgb, currentColor 18%, transparent)" }} aria-hidden />
            <div>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.65 }}>Hours</p>
              <p data-element-key="contact.hours" style={{ margin: 0, opacity: 0.9, lineHeight: 1.7 }}>{c.hours}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Scene: cafe regular checking if they're open — warm block for hours, human tone.
  if (family.contact === "warm_block") {
    return (
      <section id="contact" data-section="contact" style={{ backgroundColor: "var(--site-bg)", ...base, paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
        <div style={{ ...wrap, maxWidth: 880 }}>
          {title}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", alignItems: "start" }}>
            <div style={{ backgroundColor: "var(--site-surface)", borderRadius: "var(--site-radius)", padding: "2rem 1.75rem" }}>
              <p style={{ ...muted, margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Hours</p>
              <ContactHours hours={c.hours} style={{ fontFamily: "var(--site-font-heading)", fontSize: "1.35rem", lineHeight: 1.45 }} />
            </div>
            <div style={{ display: "grid", gap: "1.25rem" }}>
              <div>
                <p style={{ ...muted, margin: "0 0 0.35rem", fontSize: "0.85rem" }}>Drop by</p>
                <ContactAddress address={c.address} />
              </div>
              <div>
                <p style={{ ...muted, margin: "0 0 0.35rem", fontSize: "0.85rem" }}>Call or write</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.5rem" }}>
                  <ContactPhone phone={c.phone} />
                  <ContactEmail email={c.email} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Scene: shopper browsing a boutique — chips for quick scan, hours as badge.
  return (
    <section id="contact" data-section="contact" style={{ backgroundColor: "var(--site-surface)", ...base, paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
      <div style={{ ...wrap, textAlign: "center" }}>
        <SectionTitle k="contact" text={c.section_title} family={family} />
        <span
          data-element-key="contact.hours"
          style={{
            display: "inline-block",
            backgroundColor: "var(--site-primary)",
            color: "var(--site-on-primary)",
            fontSize: "0.78rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "0.55rem 1.1rem",
            borderRadius: "999px",
            margin: "0 auto 2rem",
          }}
        >
          {c.hours}
        </span>
        <div
          className="flex flex-col md:flex-row md:flex-wrap md:justify-center"
          style={{ gap: "0.75rem", alignItems: "stretch" }}
        >
          {[
            { label: "Phone", node: <ContactPhone phone={c.phone} /> },
            { label: "Email", node: <ContactEmail email={c.email} /> },
            { label: "Address", node: <span data-element-key="contact.address" style={{ ...ink, fontWeight: 600 }}>{c.address}</span> },
          ].map(({ label, node }) => (
            <div
              key={label}
              style={{
                backgroundColor: "var(--site-bg)",
                borderRadius: "var(--site-radius)",
                padding: "0.85rem 1.25rem",
                minHeight: 44,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "min(100%, 220px)",
              }}
            >
              <span style={{ ...muted, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>{label}</span>
              {node}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- cta_footer + footer chrome ---------------- */
export function CtaFooter({ c, theme, family }: P<"cta_footer">) {
  return (
    <section id="cta_footer" data-section="cta_footer" style={{ backgroundColor: "var(--site-ink)", color: "var(--site-bg)", ...getSectionStyle(theme, "cta_footer"), paddingTop: "5.5rem", paddingBottom: "5.5rem" }}>
      <div style={{ ...wrap, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "2rem" }}>
        <h2 data-element-key="cta_footer.headline" style={{ ...headingStyle(family, "clamp(1.8rem, 4vw, 2.8rem)"), margin: 0, maxWidth: "22ch" }}>
          {c.headline}
        </h2>
        <Cta k="cta_footer.cta_button" text={c.cta_text} theme={theme} style={{ padding: "1rem 2.5rem" }} />
      </div>
    </section>
  );
}

export function Footer({ brand, phone, email }: { brand: string; phone?: string; email?: string }) {
  return (
    <footer style={{ backgroundColor: "var(--site-ink)", color: "var(--site-bg)", padding: "1.5rem 1.25rem", borderTop: "1px solid color-mix(in srgb, var(--site-bg) 15%, transparent)" }}>
      <div style={{ ...wrap, display: "flex", flexWrap: "wrap", gap: "1rem 2.5rem", alignItems: "center", fontSize: "0.85rem", opacity: 0.85 }}>
        <span style={{ fontFamily: "var(--site-font-body)", fontWeight: 800 }}>{brand}</span>
        {phone && <span>{phone}</span>}
        {email && <span>{email}</span>}
        <span style={{ marginLeft: "auto" }}>© {brand}. All rights reserved.</span>
      </div>
    </footer>
  );
}
