import type { SiteRecord } from "@/lib/site-types";
import type { SectionKey, SiteContent, SiteTheme } from "@/templates/system/types";
import { getLaunchTemplate, LAUNCH_TEMPLATES, type LaunchTemplateId } from "@/templates/launch/registry";
import { PACKAGES, type TemplateId } from "@/templates/packages";
import { PALETTE_PRESETS, getPalettePreset } from "@/lib/palette-presets";
import { familyFromTemplateMeta, isFamilySeedBrand } from "@/components/web-agent/sites/seedTheme";

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

/** Relative luminance test for a #rrggbb hex — true if the colour reads "light". */
function isLightHex(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) > 150;
}

type RawSection = Record<string, unknown> & { items?: Record<string, unknown>[] };

/**
 * The backend content generator uses different field names than the render
 * contract (SiteContent): faq question/answer, pricing title/desc, cta_footer
 * text. Map those aliases onto the canonical keys so the bespoke templates
 * (and BaseTemplate) render them. Canonical keys already present always win.
 */
function normalizeContentAliases(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };

  const faq = raw.faq as RawSection | undefined;
  if (faq?.items) {
    out.faq = {
      ...faq,
      items: faq.items.map((it) => ({ ...it, q: it.q ?? it.question, a: it.a ?? it.answer })),
    };
  }

  const pricing = raw.pricing as RawSection | undefined;
  if (pricing?.items) {
    out.pricing = {
      ...pricing,
      items: pricing.items.map((it) => ({
        ...it,
        name: it.name ?? it.title,
        features: it.features ?? (it.desc != null ? [it.desc] : undefined),
      })),
    };
  }

  const cta = raw.cta_footer as Record<string, unknown> | undefined;
  if (cta && cta.headline == null && cta.text != null) {
    out.cta_footer = { ...cta, headline: cta.text };
  }

  const testimonials = raw.testimonials as RawSection | undefined;
  if (testimonials?.items) {
    out.testimonials = {
      ...testimonials,
      items: testimonials.items.map((it) => ({ ...it, avatar: it.avatar ?? it.image })),
    };
  }

  return out;
}

function profileString(bp: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = bp[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Format Indian mobile numbers for display; pass through values that already include +. */
function formatPhoneDisplay(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;
  if (trimmed.startsWith("+")) return trimmed;
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return `+${digits}`;
}

/**
 * Templates read contact phone/email/address from content, not businessProfile.
 * Merge intake fields so chat-collected WhatsApp, phone, city replace package placeholders.
 */
export function mergeContactFromProfile(
  content: SiteContent,
  businessProfile: Record<string, unknown>,
): SiteContent {
  const contact = { ...content.contact };

  const phone = profileString(businessProfile, "whatsapp_number", "phone", "phone_number");
  if (phone) contact.phone = formatPhoneDisplay(phone);

  const email = profileString(businessProfile, "email", "contact_email");
  if (email) contact.email = email;

  const address = profileString(
    businessProfile,
    "address",
    "business_address",
    "service_area",
  );
  const city = profileString(businessProfile, "city");
  if (address) contact.address = address;
  else if (city) contact.address = city;

  if (phone && /\.example$/i.test(contact.email ?? "")) {
    contact.email = "";
  }

  const ctaPref = profileString(businessProfile, "cta_preference").toLowerCase();
  if (ctaPref === "whatsapp" && phone) {
    const footer = { ...content.cta_footer };
    if (!/whatsapp/i.test(footer.cta_text ?? "")) {
      footer.cta_text = "Chat on WhatsApp";
    }
    return { ...content, contact, cta_footer: footer };
  }

  return { ...content, contact };
}

/** Map a rendered image slot (the `data-image-slot` value SlotImage emits) to its
 *  editable content path, or null for design furniture (clock/coaches) that has no
 *  content field. Used by the editor to make preview images swappable in place. */
export function imageSlotToContentPath(slot: string): string | null {
  if (slot === "hero.background" || slot === "hero.image") return "hero.image";
  if (slot === "about.image") return "about.image";
  if (/^services\.items\[\d+\]\.image$/.test(slot)) return slot;
  if (/^gallery\.items\[\d+\]\.image$/.test(slot)) return slot;
  if (/^testimonials\.items\[\d+\]\.avatar$/.test(slot)) return slot;
  return null;
}

/** Read the string value at a dotted/bracketed content path (e.g. the current
 *  image URL for a slot). Returns "" when unset. */
export function contentValueAt(content: unknown, path: string): string {
  const segs = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur: unknown = content;
  for (const s of segs) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[s];
    else return "";
  }
  return typeof cur === "string" ? cur : "";
}

/** Build a wa.me link from a display or raw phone string. */
export function phoneToWhatsAppHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `https://wa.me/91${digits}`;
  return `https://wa.me/${digits}`;
}

function asSiteContent(rawInput: Record<string, unknown>, fallback: SiteContent): SiteContent {
  const raw = normalizeContentAliases(rawInput);
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

function asSiteTheme(
  raw: Record<string, unknown>,
  fallback: SiteTheme,
  templateId?: string,
): SiteTheme {
  const brandRaw = (raw.brand ?? {}) as Record<string, unknown>;
  const fallbackBrand = fallback.brand;
  const presetId = typeof raw.palettePreset === "string" ? raw.palettePreset : fallback.palettePreset;
  const preset = getPalettePreset(presetId);
  const family = templateId ? familyFromTemplateMeta(templateId) : undefined;
  const usePackageBrand = family != null && isFamilySeedBrand(brandRaw, family);

  const brand = usePackageBrand
    ? {
        logo_url: (brandRaw.logo_url as string | null) ?? fallbackBrand.logo_url,
        logo_dark_url: (brandRaw.logo_dark_url as string | null) ?? fallbackBrand.logo_dark_url,
        favicon_url: (brandRaw.favicon_url as string | null) ?? fallbackBrand.favicon_url,
        palette_from_logo: (brandRaw.palette_from_logo as string[]) ?? fallbackBrand.palette_from_logo,
        primary: fallbackBrand.primary,
        accent: fallbackBrand.accent,
        neutral: fallbackBrand.neutral,
        bg: fallbackBrand.bg,
        surface: fallbackBrand.surface,
      }
    : {
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

  // --site-ink = brand.neutral. Older generated themes stored a light paper tone
  // there, so ink ended up the same lightness as the page bg (invisible text).
  // If ink and bg don't contrast, fall back to the dark brand colour, else a safe ink.
  if (isLightHex(brand.neutral) === isLightHex(brand.bg)) {
    brand.neutral = isLightHex(brand.bg)
      ? isLightHex(brand.primary)
        ? "#181613"
        : brand.primary
      : isLightHex(brand.primary)
        ? brand.primary
        : "#f7f5f0";
  }

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

  const businessProfile = site.businessProfileJson ?? {};
  const content = mergeContactFromProfile(
    asSiteContent(site.contentJson ?? {}, fallbackContent),
    businessProfile,
  );

  return {
    siteId: site.siteId,
    templateId,
    templateVersion: site.templateVersion,
    businessProfile,
    content,
    theme: asSiteTheme(site.themeJson ?? {}, fallbackTheme, templateId),
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
