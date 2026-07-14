export type BuilderProjectStatus = "onboarding" | "ready" | "editing";

export interface BuilderProject {
  projectId: string;
  projectName: string;
  status: BuilderProjectStatus;
  initialPrompt: string | null;
  selectedTemplateId: string | null;
  currentVersionId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface BuilderChatTurn {
  role: "user" | "assistant";
  text: string;
  ts: number;
  meta?: Record<string, unknown>;
}

export interface BuilderCompleteness {
  percent: number;
  missingFields: string[];
}

export interface BuilderChatResponse {
  assistantMessage: string;
  completeness: BuilderCompleteness;
  readyToGenerate: boolean;
  startGeneration?: boolean;
}

export interface BuilderTemplate {
  templateId: string;
  projectId?: string;
  label: string;
  style: string;
  sourceTemplateRef: string;
  s3HtmlKey: string;
  htmlContent: string;
  generatedAt?: number;
}

export interface BuilderGenerateResponse {
  status: string;
  templates: BuilderTemplate[];
}

export interface BuilderEditRecord {
  editId: string;
  projectId: string;
  ts: number;
  source: string;
  userPrompt: string;
  actionSummary: string;
  changeScope: string;
  targets: string[];
}

export interface BuilderVersion {
  versionId: string;
  projectId: string;
  label: string;
  trigger: string;
  createdAt: number;
  s3HtmlKey: string;
}

export interface BuilderAsset {
  assetId: string;
  projectId: string;
  assetType: "logo" | "brand" | "service" | "team" | "product";
  filename: string;
  contentType: string;
  s3Key: string;
  status: "pending" | "ready";
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  uploadedAt: number | null;
}

export interface BuilderBusinessProfile {
  projectId: string;
  brand: {
    brandName: string | null;
    businessName: string | null;
    tagline: string | null;
  };
  business: {
    type: string | null;
    services: string[];
    description: string | null;
    targetAudience: string | null;
  };
  location: {
    country: string | null;
    state: string | null;
    city: string | null;
    address: string | null;
  };
  contact: {
    email: string | null;
    phone: string | null;
    website: string | null;
    socialLinks: string[];
  };
  completeness: BuilderCompleteness;
  gate: {
    ready: boolean;
    percent: number;
    missingFields: string[];
  };
  updatedAt?: number;
}

export interface BuilderProjectContext {
  project: BuilderProject;
  profile: BuilderBusinessProfile;
  chat: { turns: BuilderChatTurn[] };
  assets: BuilderAsset[];
  templates: BuilderTemplate[];
  workingHtml: string | null;
  selectedTemplateId: string | null;
  versions: BuilderVersion[];
  edits: BuilderEditRecord[];
}
