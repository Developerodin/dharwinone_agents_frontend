/**
 * Phase 1 JSON schema types (plan §6.2, §6.4).
 * Templates + Content Agent + editor all share these shapes.
 */

import type { SectionKey, SiteTheme } from "./types";

/** Field constraint sent to LLM + server-side clamp. */
export interface StringFieldSchema {
  type: "string";
  maxLength: number;
}

export interface ArrayFieldSchema<TItem> {
  maxItems: number;
  item: TItem;
}

export interface ImageSlotSpec {
  role: "background" | "side_image" | "card_thumb" | "gallery_tile" | "avatar";
  aspect: string;
  minPx: { w: number; h: number };
  displayPx: { w: number; h: number };
  safeZone: "center" | "face-center";
  label: string;
  required: boolean;
  maxCount?: number;
}

/** Per-template section_schema (plan §6.2). */
export interface SectionSchemaDocument {
  template_id: string;
  template_version: number;
  sections: SectionKey[];
  image_slots: Record<string, ImageSlotSpec>;
  schema: Record<string, Record<string, unknown>>;
}

/** Theme JSON written by the visual editor (plan §6.4). */
export type ThemeDocument = SiteTheme & {
  imageOverrides?: Record<
    string,
    {
      asset_id?: string;
      focalPoint?: { x: number; y: number };
      scrimOpacity?: number;
    }
  >;
};

/** Registry row for a launch template (plan §13). */
export interface LaunchTemplateRegistryEntry {
  id: string;
  category: string;
  subcategory: string;
  style_tags: string[];
  version: number;
  status: "active" | "deprecated" | "draft";
  preview_desktop_url: string | null;
  preview_mobile_url: string | null;
  section_schema: SectionSchemaDocument;
}

/** Subset content shape for Phase 1 launch templates (5 sections). */
export interface LaunchSiteContent {
  hero: {
    headline: string;
    subtext: string;
    cta_text: string;
    image?: string;
  };
  services: {
    section_title: string;
    items: { title: string; desc: string; image?: string }[];
  };
  why_us: {
    section_title: string;
    points: string[];
  };
  testimonials: {
    section_title: string;
    items: { name: string; quote: string; avatar?: string }[];
  };
  cta_footer: {
    headline: string;
    cta_text: string;
  };
  seo?: { title: string; description: string };
}
