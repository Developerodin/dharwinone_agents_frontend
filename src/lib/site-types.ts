export type SiteStatus = "draft" | "published";

export interface SiteRecord {
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

export interface CategoryRecord {
  categoryId: string;
  name: string;
  subcategoriesJson: Array<{ id: string; name: string }>;
  questionnaireConfigJson: Record<string, unknown>;
  imagePackRefs?: string[];
}

export interface TokenTransaction {
  transactionId: string;
  userId: string;
  actionType: string | null;
  tokens: number | null;
  status: string | null;
  idempotencyKey: string | null;
  siteId: string | null;
  createdAt: number | null;
}

export interface PublishChecklistItem {
  id: string;
  ok: boolean;
  message: string;
  warn?: boolean;
}

export interface SiteGenerateResult {
  site: SiteRecord;
  usedFallback: boolean;
  cost: number;
}

export interface SiteSectionMutationResult {
  site: SiteRecord;
  section: Record<string, unknown>;
  cost: number;
  snapshotVersionId: string;
}

export interface SitePublishResult {
  site: SiteRecord;
  checklist: PublishChecklistItem[];
  revalidateTag: string;
}

export const TOKEN_COSTS = {
  full_generation: 50,
  regenerate_section: 8,
  ai_rewrite: 5,
} as const;
