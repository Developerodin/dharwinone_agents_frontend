export type ImageSourcingMode = "user_provided" | "ai_decide" | "use_defaults";

export type QuestionnaireFieldType =
  | "text"
  | "phone"
  | "tags"
  | "multi_select"
  | "single_select"
  | "boolean"
  | "enum";

export type QuestionnaireFieldTier = "required" | "recommended" | "optional";

export interface QuestionnaireOption {
  value: string;
  label: string;
}

export interface QuestionnaireFieldDef {
  id: string;
  label: string;
  type: QuestionnaireFieldType;
  tier: QuestionnaireFieldTier;
  options?: QuestionnaireOption[];
  suggestions?: string[];
  maxLength?: number;
  maxItems?: number;
  default?: string | boolean;
  showWhen?: Record<string, string[]>;
}

export interface QuestionnaireConfig {
  progressLabel?: string;
  fields: QuestionnaireFieldDef[];
}

export interface GapCheckQuestion {
  fieldId: string;
  question: string;
}

export interface MatchedTemplate {
  templateId: string;
  displayName: string;
  rank: number;
  familyLabel?: string;
  previewHref: string;
  score?: number;
}

export interface IntakePrefillRequest {
  categoryId: string;
  subcategoryId: string;
  description: string;
}

export interface IntakePrefillResponse {
  businessProfile: Record<string, unknown>;
  /** True when the response came from a local stub (backend route missing). */
  stubbed?: boolean;
}

export interface IntakeGapCheckRequest {
  categoryId: string;
  subcategoryId: string;
  businessProfile: Record<string, unknown>;
}

export interface IntakeGapCheckResponse {
  questions: GapCheckQuestion[];
  complete: boolean;
  stubbed?: boolean;
}

export interface IntakeMatchRequest {
  categoryId: string;
  subcategoryId: string;
  businessProfile: Record<string, unknown>;
}

export interface IntakeMatchResponse {
  templates: MatchedTemplate[];
  stubbed?: boolean;
}

export type IntakeStepId =
  | "category"
  | "description"
  | "questionnaire"
  | "assets"
  | "gap_check"
  | "templates"
  | "generating";

export const INTAKE_STEPS: { id: IntakeStepId; label: string }[] = [
  { id: "category", label: "Category" },
  { id: "description", label: "Describe" },
  { id: "questionnaire", label: "Details" },
  { id: "assets", label: "Assets" },
  { id: "gap_check", label: "Follow-ups" },
  { id: "templates", label: "Template" },
];

export interface IntakeWizardState {
  step: IntakeStepId;
  categoryId: string;
  subcategoryId: string;
  description: string;
  businessProfile: Record<string, unknown>;
  logoFile: File | null;
  gapQuestions: GapCheckQuestion[];
  gapAnswers: Record<string, string>;
  matchedTemplates: MatchedTemplate[];
  selectedTemplateId: string | null;
  error: string | null;
  apiNotes: string[];
}
