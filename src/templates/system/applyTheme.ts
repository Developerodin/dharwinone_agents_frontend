import type { CSSProperties } from "react";
import type { ElementOverride, FamilyConfig, SectionKey, SectionOverride, SiteTheme } from "./types";
import { getElementStyle, themeToVars } from "./theme";

const PAD: Record<NonNullable<SectionOverride["padding"]>, string> = {
  compact: "2.5rem 1.25rem",
  normal: "4.5rem 1.25rem",
  spacious: "7rem 1.25rem",
};

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

function elementVarKey(key: string): string {
  return `--el-${key.replace(/\./g, "-").replace(/\[\]/g, "item")}`;
}

function sectionVarKey(section: string, prop: string): string {
  return `--section-${section}-${prop}`;
}

/**
 * Apply theme JSON to the site root: brand palette, sectionOverrides, elementOverrides
 * all become CSS custom properties. Templates read semantic Tailwind classes or these vars.
 */
export function applySiteTheme(theme: SiteTheme, family: FamilyConfig): CSSProperties {
  const vars: Record<string, string> = {};

  for (const [k, v] of Object.entries(themeToVars(theme, family))) {
    if (typeof v === "string") vars[k] = v;
  }

  for (const [section, override] of Object.entries(theme.sectionOverrides) as [SectionKey, SectionOverride][]) {
    if (!override) continue;
    if (override.bgColor) vars[sectionVarKey(section, "bg")] = override.bgColor;
    if (override.textColor) vars[sectionVarKey(section, "text")] = override.textColor;
    if (override.align) vars[sectionVarKey(section, "align")] = override.align;
    if (override.padding) vars[sectionVarKey(section, "padding")] = PAD[override.padding];
    if (override.height === "tall") vars[sectionVarKey(section, "min-height")] = "80vh";
    if (override.height === "short") vars[sectionVarKey(section, "padding-block")] = "1.5rem";
  }

  for (const [key, override] of Object.entries(theme.elementOverrides)) {
    const prefix = elementVarKey(key);
    if (override.bg) vars[`${prefix}-bg`] = override.bg;
    if (override.textColor) vars[`${prefix}-text`] = override.textColor;
    if (override.radius) vars[`${prefix}-radius`] = RADIUS[override.radius];
    if (override.size) vars[`${prefix}-padding`] = SIZE[override.size];
  }

  vars["--site-scrim"] = "color-mix(in srgb, var(--site-ink) 72%, transparent)";
  vars["--site-scrim-light"] = "color-mix(in srgb, var(--site-ink) 25%, transparent)";
  vars["--site-on-dark"] = "var(--site-bg)";

  return vars as CSSProperties;
}

/** Section wrapper styles — reads section override vars with fallbacks. */
export function sectionStyle(theme: SiteTheme, key: SectionKey): CSSProperties {
  const o = theme.sectionOverrides[key] ?? {};
  return {
    padding: o.padding ? PAD[o.padding] : "var(--section-padding, 4.5rem 1.25rem)",
    backgroundColor: o.bgColor ?? `var(--section-${key}-bg, var(--site-bg))`,
    color: o.textColor ?? `var(--section-${key}-text, var(--site-ink))`,
    textAlign: o.align ?? undefined,
    minHeight: o.height === "tall" ? "80vh" : undefined,
  };
}

/** Per-element override styles — only explicit theme JSON overrides; never reference unset CSS vars. */
export function elementStyle(theme: SiteTheme, key: string): CSSProperties {
  return getElementStyle(theme, key);
}

export { visibleSections } from "./theme";
