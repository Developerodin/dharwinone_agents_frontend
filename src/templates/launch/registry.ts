import type { ComponentType } from "react";
import type { LaunchTemplateRegistryEntry, SectionSchemaDocument } from "../system/schema";
import type { SiteContent, SiteTheme } from "../system/types";
import { ElectricianBoldTemplate } from "./electrician_bold_v1/ElectricianBoldTemplate";
import { ElectricianTrustTemplate } from "./electrician_trust_v1/ElectricianTrustTemplate";
import { CafeWarmTemplate } from "./ht_cafe_v1/CafeWarmTemplate";
import boldContent from "./electrician_bold_v1/default_content.json";
import boldTheme from "./electrician_bold_v1/default_theme.json";
import boldSchema from "./electrician_bold_v1/section_schema.json";
import trustContent from "./electrician_trust_v1/default_content.json";
import trustTheme from "./electrician_trust_v1/default_theme.json";
import trustSchema from "./electrician_trust_v1/section_schema.json";
import cafeContent from "../packages/ht_cafe_v1/default_content.json";
import cafeTheme from "../packages/ht_cafe_v1/default_theme.json";
import cafeSchema from "../packages/ht_cafe_v1/section_schema.json";

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
const cafeSchemaDoc = cafeSchema as unknown as SectionSchemaDocument;

export const LAUNCH_TEMPLATES = {
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
  ht_cafe_v1: {
    registry: {
      id: "ht_cafe_v1",
      category: "hospitality_travel",
      subcategory: "cafe_restaurant",
      style_tags: ["warm_craft"],
      version: 1,
      status: "active",
      preview_desktop_url: null,
      preview_mobile_url: null,
      section_schema: cafeSchemaDoc,
    },
    section_schema: cafeSchemaDoc,
    default_content: cafeContent as unknown as SiteContent,
    default_theme: cafeTheme as unknown as SiteTheme,
    Component: CafeWarmTemplate,
  },
} as const satisfies Record<string, LaunchTemplateDefinition>;

export type LaunchTemplateId = keyof typeof LAUNCH_TEMPLATES;

export function getLaunchTemplate(id: string): LaunchTemplateDefinition | undefined {
  return LAUNCH_TEMPLATES[id as LaunchTemplateId];
}

export function listLaunchTemplates(category?: string, subcategory?: string) {
  return Object.values(LAUNCH_TEMPLATES).filter((t) => {
    if (category && t.registry.category !== category) return false;
    if (subcategory && t.registry.subcategory !== subcategory) return false;
    return true;
  });
}
