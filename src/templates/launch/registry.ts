import type { ComponentType } from "react";
import type { LaunchTemplateRegistryEntry, SectionSchemaDocument } from "../system/schema";
import type { FamilyId, SiteContent, SiteTheme } from "../system/types";
import { PACKAGES } from "../packages";
import { composeLaunchTemplate } from "./shared/composeLaunchTemplate";
import { FAMILY_PRESETS } from "./shared/familyPresets";
import { ElectricianBoldTemplate } from "./electrician_bold_v1/ElectricianBoldTemplate";
import { ElectricianTrustTemplate } from "./electrician_trust_v1/ElectricianTrustTemplate";
import boldContent from "./electrician_bold_v1/default_content.json";
import boldTheme from "./electrician_bold_v1/default_theme.json";
import boldSchema from "./electrician_bold_v1/section_schema.json";
import trustContent from "./electrician_trust_v1/default_content.json";
import trustTheme from "./electrician_trust_v1/default_theme.json";
import trustSchema from "./electrician_trust_v1/section_schema.json";

export interface LaunchTemplateProps {
  content?: SiteContent;
  theme?: SiteTheme;
  brandName?: string;
}

export interface LaunchTemplateDefinition {
  registry: LaunchTemplateRegistryEntry;
  section_schema: SectionSchemaDocument;
  default_content: SiteContent;
  default_theme: SiteTheme;
  Component: ComponentType<LaunchTemplateProps>;
}

const trustSchemaDoc = trustSchema as unknown as SectionSchemaDocument;
const boldSchemaDoc = boldSchema as unknown as SectionSchemaDocument;

// Hand-tuned reference templates (not catalog package ids).
const BESPOKE: Record<string, LaunchTemplateDefinition> = {
  electrician_trust_v1: {
    registry: {
      id: "electrician_trust_v1",
      category: "local_service",
      subcategory: "electrician",
      style_tags: ["trust_local", "split_hero", "cards"],
      version: 1,
      status: "active",
      preview_desktop_url: null,
      preview_mobile_url: null,
      section_schema: trustSchemaDoc,
    },
    section_schema: trustSchemaDoc,
    default_content: trustContent as unknown as SiteContent,
    default_theme: trustTheme as SiteTheme,
    Component: ElectricianTrustTemplate,
  },
  electrician_bold_v1: {
    registry: {
      id: "electrician_bold_v1",
      category: "local_service",
      subcategory: "electrician",
      style_tags: ["bold_convert", "fullbleed", "urgency"],
      version: 1,
      status: "active",
      preview_desktop_url: null,
      preview_mobile_url: null,
      section_schema: boldSchemaDoc,
    },
    section_schema: boldSchemaDoc,
    default_content: boldContent as unknown as SiteContent,
    default_theme: boldTheme as SiteTheme,
    Component: ElectricianBoldTemplate,
  },
};

interface PackageRegistry {
  family?: string;
  segment?: string;
  category?: string;
  subcategory?: string;
  subcategoryLabel?: string;
}

// One bespoke launch template per catalog package, using its family preset.
const GENERATED: Record<string, LaunchTemplateDefinition> = Object.fromEntries(
  Object.entries(PACKAGES).map(([id, pkg]) => {
    const reg = pkg.registry as PackageRegistry;
    const family = (reg.family ?? "generic") as FamilyId;
    const presetFor = FAMILY_PRESETS[family] ?? FAMILY_PRESETS.generic;
    const eyebrow = reg.subcategoryLabel ?? reg.subcategory ?? "Local Business";
    const schemaDoc = pkg.schema as unknown as SectionSchemaDocument;
    const def: LaunchTemplateDefinition = {
      registry: {
        id,
        category: reg.segment ?? reg.category ?? "",
        subcategory: reg.subcategory ?? "",
        style_tags: [family],
        version: 1,
        status: "active",
        preview_desktop_url: null,
        preview_mobile_url: null,
        section_schema: schemaDoc,
      },
      section_schema: schemaDoc,
      default_content: pkg.content as unknown as SiteContent,
      default_theme: pkg.theme as unknown as SiteTheme,
      Component: composeLaunchTemplate(id, presetFor(eyebrow)),
    };
    return [id, def];
  }),
);

export const LAUNCH_TEMPLATES: Record<string, LaunchTemplateDefinition> = {
  ...GENERATED,
  ...BESPOKE,
};

export type LaunchTemplateId =
  | keyof typeof PACKAGES
  | "electrician_trust_v1"
  | "electrician_bold_v1";

export function getLaunchTemplate(id: string): LaunchTemplateDefinition | undefined {
  return LAUNCH_TEMPLATES[id];
}

export function listLaunchTemplates(category?: string, subcategory?: string) {
  return Object.values(LAUNCH_TEMPLATES).filter((t) => {
    if (category && t.registry.category !== category) return false;
    if (subcategory && t.registry.subcategory !== subcategory) return false;
    return true;
  });
}
