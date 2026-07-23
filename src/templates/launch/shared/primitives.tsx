import type { CSSProperties, ReactNode } from "react";
import type { FamilyConfig, SiteTheme } from "../../system/types";
import { applySiteTheme, elementStyle } from "../../system/applyTheme";
import "../../site-tokens.css";

const WRAP = "mx-auto w-full max-w-[1140px] px-5";

export interface SiteRootProps {
  theme: SiteTheme;
  family: FamilyConfig;
  templateId: string;
  children: ReactNode;
}

export function SiteRoot({ theme, family, templateId, children }: SiteRootProps) {
  return (
    <div
      data-site-root
      data-template-id={templateId}
      data-template-family={family.id}
      style={applySiteTheme(theme, family)}
      className="min-h-dvh bg-bg text-ink font-body"
    >
      {children}
    </div>
  );
}

export function SiteWrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${WRAP} ${className}`.trim()}>{children}</div>;
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 text-[0.78rem] font-bold uppercase tracking-[0.18em] text-kicker">{children}</p>
  );
}

export function SectionTitle({
  elementKey,
  children,
  className = "",
}: {
  elementKey: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      data-element-key={elementKey}
      className={`mb-10 font-heading text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold leading-tight text-ink ${className}`}
    >
      {children}
    </h2>
  );
}

export function CtaButton({
  elementKey,
  theme,
  children,
  ghost,
  href = "#contact",
  className = "",
}: {
  elementKey: string;
  theme: SiteTheme;
  children: ReactNode;
  ghost?: boolean;
  href?: string;
  className?: string;
}) {
  const overrides = elementStyle(theme, elementKey);
  const base: CSSProperties = ghost
    ? {
        backgroundColor: "transparent",
        color: "inherit",
        border: "1.5px solid currentColor",
      }
    : {
        backgroundColor: "var(--site-accent)",
        color: "var(--site-on-accent)",
        border: "1.5px solid var(--site-accent)",
      };

  return (
    <a
      href={href}
      data-element-key={elementKey}
      style={{ ...base, ...overrides, textDecoration: "none", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.03em", display: "inline-block" }}
      className={`rounded-site px-7 py-3 transition-opacity hover:opacity-90 ${className}`}
    >
      {children}
    </a>
  );
}

export function SlotImage({
  slot,
  src,
  alt,
  className = "",
  eager,
}: {
  slot: string;
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        data-image-slot={slot}
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        className={`block h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      data-image-slot={slot}
      aria-hidden
      className={`min-h-[10rem] w-full bg-gradient-to-br from-primary-soft to-surface ${className}`}
    />
  );
}

export function ScrimOverlay({ opacity = 0.55 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background: `linear-gradient(200deg, color-mix(in srgb, var(--site-ink) ${Math.round(opacity * 35)}%, transparent) 0%, color-mix(in srgb, var(--site-ink) ${Math.round(opacity * 100)}%, transparent) 78%)`,
      }}
    />
  );
}

export function TextLogo({ name }: { name: string }) {
  return (
    <span
      data-element-key="brand.name"
      className="truncate font-heading text-[1.1rem] font-extrabold tracking-tight text-ink"
    >
      {name}
    </span>
  );
}

export function SiteHeader({
  brand,
  cta,
  theme,
}: {
  brand: string;
  cta: string;
  theme: SiteTheme;
}) {
  return (
    <header className="border-b border-line px-5 py-2.5">
      <div className={`${WRAP} flex min-w-0 items-center gap-4`}>
        <TextLogo name={brand} />
        <div className="ml-auto shrink-0">
          <CtaButton elementKey="header.cta_button" theme={theme} className="!px-5 !py-2.5">
            {cta}
          </CtaButton>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ brand }: { brand: string }) {
  return (
    <footer className="border-t border-line px-5 py-6 text-center text-sm text-muted">
      <p data-element-key="footer.copyright" className="m-0">
        © {new Date().getFullYear()} {brand}. All rights reserved.
      </p>
    </footer>
  );
}
