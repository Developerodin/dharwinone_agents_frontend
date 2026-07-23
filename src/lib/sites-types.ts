export type FamilyId =
  | "trust_local"
  | "bold_convert"
  | "clean_pro"
  | "premium_dark"
  | "warm_craft"
  | "fresh_retail";

export type SiteStatus = "draft" | "published";

export interface SiteDoc {
  siteId: string;
  userId: string;
  templateId: string | null;
  templateVersion: string | null;
  businessProfileJson: Record<string, unknown>;
  contentJson: Record<string, unknown>;
  themeJson: Record<string, unknown>;
  status: SiteStatus;
  subdomain: string | null;
  customDomain: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface FollowUp {
  field: string;
  question: string;
  tier: string;
  hint?: string;
}

export interface CategorySummary {
  categoryId: string;
  name: string;
  subcategoriesJson?: Array<{ id: string; name: string }>;
}

export interface TemplateMatch {
  templateId: string;
  score: number;
  reason: string;
}

export interface SiteVersionSummary {
  versionId: string;
  label: string;
  createdAt: number;
}

export interface PublishResult {
  site: SiteDoc;
  revalidateTag: string;
  versionId: string;
}
