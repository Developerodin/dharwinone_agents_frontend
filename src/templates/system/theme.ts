import type { CSSProperties } from "react";
import type { ElementOverride, FamilyConfig, SectionKey, SectionOverride, SiteTheme } from "./types";

/**
 * Theme JSON + family config -> CSS variables on the template root.
 * Every section/element styles itself ONLY through these vars (template contract:
 * zero hardcoded colors in section markup).
 */
/** Relative luminance of a #rrggbb hex — picks readable text color for colored fills. */
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150;
}

export function themeToVars(theme: SiteTheme, family: FamilyConfig): CSSProperties {
  const b = theme.brand;
  return {
    "--site-primary": b.primary,
    "--site-accent": b.accent,
    "--site-ink": b.neutral,
    "--site-bg": b.bg,
    "--site-surface": b.surface,
    // ponytail: derived, not user-chosen — tint/shade math via color-mix + luminance
    // 72% keeps muted text ≥4.5:1 (AA) on the tinted paper backgrounds; 62% measured 4.17:1
    "--site-muted": `color-mix(in srgb, ${b.neutral} 72%, transparent)`,
    // kicker labels: accent pulled toward ink so small uppercase text passes AA on the page bg
    "--site-kicker": `color-mix(in srgb, ${b.accent} 55%, ${b.neutral})`,
    "--site-line": `color-mix(in srgb, ${b.neutral} 14%, transparent)`,
    "--site-primary-soft": `color-mix(in srgb, ${b.primary} 10%, ${b.bg})`,
    "--site-on-primary": isLight(b.primary) ? "#181613" : "#F7F5F0",
    "--site-on-accent": isLight(b.accent) ? "#181613" : "#F7F5F0",
    // accent usable over the dark hero scrim: primary if it reads light, else the accent, else cream
    "--site-hero-accent": isLight(b.primary) ? b.primary : b.accent !== b.primary ? b.accent : "#F7F5F0",
    "--site-font-heading": family.fontHeading,
    "--site-font-body": family.fontBody,
    "--site-radius": family.radius,
  } as CSSProperties;
}

const PAD: Record<NonNullable<SectionOverride["padding"]>, string> = {
  compact: "2.5rem 1.25rem",
  normal: "4.5rem 1.25rem",
  spacious: "7rem 1.25rem",
};

export function getSectionStyle(theme: SiteTheme, key: SectionKey): CSSProperties {
  const o = theme.sectionOverrides[key] ?? {};
  const s: CSSProperties = { padding: PAD[o.padding ?? "normal"] };
  if (o.bgColor) s.backgroundColor = o.bgColor;
  if (o.textColor) s.color = o.textColor;
  if (o.align === "center") s.textAlign = "center";
  if (o.height === "tall") s.minHeight = "80vh";
  if (o.height === "short") s.paddingTop = s.paddingBottom = "1.5rem";
  return s;
}

const RADIUS: Record<NonNullable<ElementOverride["radius"]>, string> = {
  none: "0",
  md: "var(--site-radius)",
  full: "9999px",
};
const SIZE: Record<NonNullable<ElementOverride["size"]>, string> = {
  sm: "0.5rem 1rem",
  md: "0.75rem 1.5rem",
  lg: "1rem 2.25rem",
};

export function getElementStyle(theme: SiteTheme, key: string): CSSProperties {
  const o = theme.elementOverrides[key] ?? {};
  const s: CSSProperties = {};
  if (o.bg) s.backgroundColor = o.bg;
  if (o.textColor) s.color = o.textColor;
  if (o.radius) s.borderRadius = RADIUS[o.radius];
  if (o.size) s.padding = SIZE[o.size];
  return s;
}

/** Visible section keys in render order. */
export function visibleSections(theme: SiteTheme): SectionKey[] {
  const hidden = new Set(theme.hiddenSections);
  return theme.sectionOrder.filter((k) => !hidden.has(k));
}
