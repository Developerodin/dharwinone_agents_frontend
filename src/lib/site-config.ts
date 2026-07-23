import type { SiteRecord } from "@/lib/site-types";
import type { SectionKey, SiteContent, SiteTheme } from "@/templates/system/types";
import { getLaunchTemplate, LAUNCH_TEMPLATES, type LaunchTemplateId } from "@/templates/launch/registry";
import { PACKAGES, type TemplateId } from "@/templates/packages";
import { PALETTE_PRESETS, getPalettePreset } from "@/lib/palette-presets";

export interface SiteConfig {
  siteId: string;
  templateId: string;
  templateVersion: string | null;
  businessProfile: Record<string, unknown>;
  content: SiteContent;
  theme: SiteTheme;
}

export function isLaunchTemplateId(templateId: string): templateId is LaunchTemplateId {
  return templateId in LAUNCH_TEMPLATES;
}

const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "hero",
  "services",
  "about",
  "why_us",
  "gallery",
  "testimonials",
  "pricing",
  "faq",
  "contact",
  "cta_footer",
];

function asSiteContent(raw: Record<string, unknown>, fallback: SiteContent): SiteContent {
  // ponytail: merge each section one level deep so a partial persisted section
  // (e.g. gallery with a renamed title but no items) keeps the fallback's items
  // instead of clobbering the whole section. Sub-objects/arrays inside a section
  // are not deep-merged — persisted wins there, which is what we want.
  const merged: Record<string, unknown> = { ...fallback, ...raw };
  for (const key of Object.keys(fallback) as (keyof SiteContent)[]) {
    const base = fallback[key];
    const over = raw[key];
    const isPlainObject = (v: unknown) => !!v && typeof v === "object" && !Array.isArray(v);
    if (isPlainObject(base) && isPlainObject(over)) {
      merged[key] = { ...(base as object), ...(over as object) };
    }
  }
  return merged as unknown as SiteContent;
}

function asSiteTheme(raw: Record<string, unknown>, fallback: SiteTheme): SiteTheme {
  const brandRaw = (raw.brand ?? {}) as Record<string, unknown>;
  const fallbackBrand = fallback.brand;
  const presetId = typeof raw.palettePreset === "string" ? raw.palettePreset : fallback.palettePreset;
  const preset = getPalettePreset(presetId);

  const brand = {
    logo_url: (brandRaw.logo_url as string | null) ?? fallbackBrand.logo_url,
    logo_dark_url: (brandRaw.logo_dark_url as string | null) ?? fallbackBrand.logo_dark_url,
    favicon_url: (brandRaw.favicon_url as string | null) ?? fallbackBrand.favicon_url,
    palette_from_logo: (brandRaw.palette_from_logo as string[]) ?? fallbackBrand.palette_from_logo,
    primary: (brandRaw.primary as string) ?? preset?.primary ?? fallbackBrand.primary,
    accent: (brandRaw.accent as string) ?? preset?.accent ?? fallbackBrand.accent,
    neutral: (brandRaw.neutral as string) ?? preset?.neutral ?? fallbackBrand.neutral,
    bg: (brandRaw.bg as string) ?? preset?.bg ?? fallbackBrand.bg,
    surface: (brandRaw.surface as string) ?? preset?.surface ?? fallbackBrand.surface,
  };

  return {
    brand,
    fontPair: (raw.fontPair as string) ?? fallback.fontPair,
    palettePreset: presetId,
    sectionOverrides: (raw.sectionOverrides as SiteTheme["sectionOverrides"]) ?? fallback.sectionOverrides,
    elementOverrides: (raw.elementOverrides as SiteTheme["elementOverrides"]) ?? fallback.elementOverrides,
    sectionOrder: (raw.sectionOrder as SectionKey[]) ?? fallback.sectionOrder ?? DEFAULT_SECTION_ORDER,
    hiddenSections: (raw.hiddenSections as SectionKey[]) ?? fallback.hiddenSections ?? [],
  };
}

export function resolveTemplateId(templateId: string | null): string {
  if (templateId && isLaunchTemplateId(templateId)) return templateId;
  if (templateId && templateId in PACKAGES) return templateId;
  return "ls_electrician_v1";
}

export function getSectionSchemaForTemplate(templateId: string): Record<string, unknown> {
  const launch = getLaunchTemplate(templateId);
  if (launch) return launch.section_schema as unknown as Record<string, unknown>;
  if (templateId in PACKAGES) {
    return (PACKAGES[templateId as TemplateId].schema ?? {}) as Record<string, unknown>;
  }
  return {};
}

function templateFallbacks(templateId: string): { content: SiteContent; theme: SiteTheme } {
  const launch = getLaunchTemplate(templateId);
  if (launch) {
    return {
      content: launch.default_content as unknown as SiteContent,
      theme: launch.default_theme,
    };
  }
  const pkg = PACKAGES[templateId as TemplateId] ?? PACKAGES.ls_electrician_v1;
  return {
    content: pkg.content as unknown as SiteContent,
    theme: pkg.theme as unknown as SiteTheme,
  };
}

export function siteRecordToConfig(site: SiteRecord): SiteConfig {
  const templateId = resolveTemplateId(site.templateId);
  const { content: fallbackContent, theme: fallbackTheme } = templateFallbacks(templateId);

  return {
    siteId: site.siteId,
    templateId,
    templateVersion: site.templateVersion,
    businessProfile: site.businessProfileJson ?? {},
    content: asSiteContent(site.contentJson ?? {}, fallbackContent),
    theme: asSiteTheme(site.themeJson ?? {}, fallbackTheme),
  };
}

export function configToSitePatch(config: SiteConfig): {
  contentJson: Record<string, unknown>;
  themeJson: Record<string, unknown>;
  businessProfileJson: Record<string, unknown>;
  templateId: string;
  templateVersion: string | null;
} {
  return {
    templateId: config.templateId,
    templateVersion: config.templateVersion,
    businessProfileJson: config.businessProfile,
    contentJson: config.content as unknown as Record<string, unknown>,
    themeJson: config.theme as unknown as Record<string, unknown>,
  };
}

export function applyPalettePreset(theme: SiteTheme, presetId: string): SiteTheme {
  const preset = getPalettePreset(presetId) ?? PALETTE_PRESETS[0];
  return {
    ...theme,
    palettePreset: preset.id,
    brand: {
      ...theme.brand,
      primary: preset.primary,
      accent: preset.accent,
      neutral: preset.neutral,
      bg: preset.bg,
      surface: preset.surface,
    },
  };
}

export function brandNameFromConfig(config: SiteConfig): string {
  const bp = config.businessProfile;
  if (typeof bp.business_name === "string" && bp.business_name.trim()) return bp.business_name;
  if (typeof bp.brandName === "string" && bp.brandName.trim()) return bp.brandName;
  return config.content.seo?.title?.split("—")[0]?.trim() ?? "Your Business";
}
