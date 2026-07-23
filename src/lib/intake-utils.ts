import type { CategoryRecord } from "@/lib/site-types";
import { LAUNCH_TEMPLATES } from "@/templates/launch/SiteRenderer";
import { PACKAGES, type TemplateId } from "@/templates/packages";
import type {
  GapCheckQuestion,
  ImageSourcingMode,
  MatchedTemplate,
  QuestionnaireConfig,
  QuestionnaireFieldDef,
  QuestionnaireFieldType,
  QuestionnaireOption,
} from "@/lib/intake-types";

type RawQuestionnaireConfig = Record<string, unknown>;

function optionLabel(value: string): string {
  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    phone: "Phone call",
    form: "Contact form",
    ai_decide: "Let AI choose images",
    user_provided: "I'll upload my images",
    use_defaults: "Use default looks",
  };
  if (labels[value]) return labels[value];
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

function coerceOptionsRaw(raw: unknown): unknown {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return raw;
}

/** Seed config may use string[] or { value, label }[] — normalize for select rendering. */
export function getFieldOptions(field: Pick<QuestionnaireFieldDef, "options">): QuestionnaireOption[] {
  return normalizeFieldOptions(field.options) ?? [];
}

function normalizeFieldOptions(raw: unknown): QuestionnaireFieldDef["options"] {
  const coerced = coerceOptionsRaw(raw);
  if (coerced && typeof coerced === "object" && !Array.isArray(coerced)) {
    return Object.entries(coerced as Record<string, unknown>).map(([value, label]) => ({
      value,
      label: String(label ?? optionLabel(value)),
    }));
  }
  if (!Array.isArray(coerced) || coerced.length === 0) return undefined;
  return coerced.map((item) => {
    if (typeof item === "string") {
      return { value: item, label: optionLabel(item) };
    }
    if (item && typeof item === "object" && "value" in item) {
      const obj = item as { value: unknown; label?: unknown };
      const value = String(obj.value ?? "");
      return { value, label: String(obj.label ?? optionLabel(value)) };
    }
    const value = String(item);
    return { value, label: optionLabel(value) };
  });
}

function fieldTypeFromRaw(raw: Record<string, unknown>): QuestionnaireFieldType {
  const t = String(raw.type ?? "text");
  if (t === "enum") return "enum";
  if (
    t === "text" ||
    t === "phone" ||
    t === "tags" ||
    t === "multi_select" ||
    t === "single_select" ||
    t === "boolean"
  ) {
    return t;
  }
  return "text";
}

/** Normalize seed questionnaireConfigJson or example fields[] into a flat field list. */
export function normalizeQuestionnaireConfig(
  raw: RawQuestionnaireConfig | null | undefined,
): QuestionnaireConfig {
  if (!raw) return { fields: [] };

  if (Array.isArray(raw.fields)) {
    const fields = (raw.fields as Record<string, unknown>[]).map((f) => ({
      id: String(f.id),
      label: String(f.label ?? f.id),
      type: fieldTypeFromRaw(f),
      tier: (f.tier as QuestionnaireFieldDef["tier"]) ?? "recommended",
      options: normalizeFieldOptions(f.options),
      suggestions: Array.isArray(f.suggestions) ? (f.suggestions as string[]) : undefined,
      maxLength: typeof f.maxLength === "number" ? f.maxLength : undefined,
      maxItems: typeof f.maxItems === "number" ? f.maxItems : undefined,
      default: f.default as string | boolean | undefined,
      showWhen: f.show_when as Record<string, string[]> | undefined,
    }));
    return {
      progressLabel:
        typeof raw.progress_label === "string" ? raw.progress_label : undefined,
      fields,
    };
  }

  const required = Array.isArray(raw.required) ? (raw.required as string[]) : [];
  const recommended = Array.isArray(raw.recommended) ? (raw.recommended as string[]) : [];
  const fieldMap = (raw.fields ?? {}) as Record<string, Record<string, unknown>>;

  const fields: QuestionnaireFieldDef[] = Object.entries(fieldMap).map(([id, meta]) => {
    let tier: QuestionnaireFieldDef["tier"] = "optional";
    if (required.includes(id)) tier = "required";
    else if (recommended.includes(id)) tier = "recommended";

    return {
      id,
      label: String(meta.label ?? id),
      type: fieldTypeFromRaw(meta),
      tier,
      options: normalizeFieldOptions(meta.options),
      suggestions: Array.isArray(meta.suggestions) ? (meta.suggestions as string[]) : undefined,
      maxLength: typeof meta.maxLength === "number" ? meta.maxLength : undefined,
      maxItems: typeof meta.maxItems === "number" ? meta.maxItems : undefined,
      default: meta.default as string | boolean | undefined,
    };
  });

  return { fields };
}

export function getCategoryQuestionnaire(category: CategoryRecord | null): QuestionnaireConfig {
  if (!category) return { fields: [] };
  return normalizeQuestionnaireConfig(
    category.questionnaireConfigJson as RawQuestionnaireConfig,
  );
}

export function fieldVisible(
  field: QuestionnaireFieldDef,
  profile: Record<string, unknown>,
): boolean {
  if (!field.showWhen) return true;
  return Object.entries(field.showWhen).every(([key, values]) => {
    const current = profile[key];
    return values.includes(String(current ?? ""));
  });
}

export function isFieldEmpty(value: unknown, type: QuestionnaireFieldType): boolean {
  if (value === null || value === undefined) return true;
  if (type === "boolean") return false;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
}

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatFieldValue(value: unknown, _type: QuestionnaireFieldType): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value ?? "");
}

export function stubPrefill(
  req: { categoryId: string; subcategoryId: string; description: string },
  config: QuestionnaireConfig,
): Record<string, unknown> {
  const profile: Record<string, unknown> = {
    category_id: req.categoryId,
    subcategory_id: req.subcategoryId,
    description: req.description.trim(),
    image_sourcing_mode: "ai_decide" satisfies ImageSourcingMode,
  };

  const trimmed = req.description.trim();
  if (trimmed) {
    const nameMatch = trimmed.match(/^(.+?)(?:\s+(?:in|at|for|near|based in)\s+)/i);
    const candidate = (nameMatch?.[1] ?? trimmed.split(/[,.]/)[0] ?? "").trim();
    if (candidate) profile.business_name = candidate.slice(0, 60);

    const cityMatch = trimmed.match(/\b(?:in|at|near)\s+([A-Za-z][A-Za-z\s.-]{1,40})/i);
    if (cityMatch?.[1]) profile.city = cityMatch[1].trim().slice(0, 40);
  }

  for (const field of config.fields) {
    if (field.default !== undefined && profile[field.id] === undefined) {
      profile[field.id] = field.default;
    }
  }

  return profile;
}

export function stubGapCheck(
  profile: Record<string, unknown>,
  config: QuestionnaireConfig,
): GapCheckQuestion[] {
  const questions: GapCheckQuestion[] = [];

  for (const field of config.fields) {
    if (field.tier !== "required") continue;
    if (!fieldVisible(field, profile)) continue;
    if (!isFieldEmpty(profile[field.id], field.type)) continue;
    if (questions.length >= 3) break;

    questions.push({
      fieldId: field.id,
      question: `What is your ${field.label.toLowerCase()}?`,
    });
  }

  if (
    questions.length < 3 &&
    Array.isArray(profile.services) &&
    (profile.services as unknown[]).length < 2
  ) {
    questions.push({
      fieldId: "services",
      question: "Add at least 2 main services so your site looks complete.",
    });
  }

  return questions.slice(0, 3);
}

const GENERIC_FALLBACK: TemplateId = "gn_generic_v1";

const LAUNCH_DISPLAY_NAMES: Record<string, string> = {
  electrician_trust_v1: "Trust Local Electrician",
  electrician_bold_v1: "Bold Electrician",
};

export function templatePreviewHref(templateId: string, siteId?: string): string {
  const base =
    templateId in LAUNCH_TEMPLATES
      ? `/template-preview/launch/${templateId}`
      : `/template-preview/${templateId}`;
  return siteId ? `${base}?siteId=${encodeURIComponent(siteId)}` : base;
}

const INTAKE_METADATA_KEYS = new Set([
  "category_id",
  "subcategory_id",
  "description",
  "logo_provided",
  "logo_filename",
]);

export function normalizeProfileForApi(
  profile: Record<string, unknown>,
  categoryId?: string,
  subcategoryId?: string,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(profile)) {
    if (!INTAKE_METADATA_KEYS.has(key)) cleaned[key] = value;
  }
  return {
    ...cleaned,
    category: cleaned.category ?? profile.category_id ?? categoryId,
    subcategory: cleaned.subcategory ?? profile.subcategory_id ?? subcategoryId,
  };
}

function displayNameForTemplate(templateId: string): string {
  if (templateId in LAUNCH_TEMPLATES) {
    return LAUNCH_DISPLAY_NAMES[templateId] ?? templateId.replace(/_/g, " ");
  }
  const pkg = PACKAGES[templateId as TemplateId];
  const reg = pkg?.registry as { displayName?: string; familyLabel?: string } | undefined;
  return reg?.displayName ?? templateId.replace(/_/g, " ");
}

function familyLabelForTemplate(templateId: string): string | undefined {
  if (templateId in LAUNCH_TEMPLATES) {
    const tags = LAUNCH_TEMPLATES[templateId as keyof typeof LAUNCH_TEMPLATES].registry.style_tags;
    return tags[0]?.replace(/_/g, " ");
  }
  const pkg = PACKAGES[templateId as TemplateId];
  return (pkg?.registry as { familyLabel?: string } | undefined)?.familyLabel;
}

export function mapBackendMatches(
  matches: Array<{ templateId: string; score: number; reason: string }>,
): MatchedTemplate[] {
  return matches.map((match, index) => ({
    templateId: match.templateId,
    displayName: displayNameForTemplate(match.templateId),
    rank: index + 1,
    familyLabel: familyLabelForTemplate(match.templateId),
    previewHref: templatePreviewHref(match.templateId),
    score: match.score,
  }));
}

export function stubMatchTemplates(
  categoryId: string,
  subcategoryId: string,
  profile: Record<string, unknown>,
): MatchedTemplate[] {
  const tone = String(profile.tone_preference ?? "");

  const launchEntries = Object.entries(LAUNCH_TEMPLATES)
    .map(([templateId, pkg]) => {
      const reg = pkg.registry;
      const segmentMatch = reg.category === categoryId;
      const subMatch = reg.subcategory === subcategoryId;
      let score = 0;
      if (subMatch) score += 10;
      else if (segmentMatch) score += 4;
      if (tone && reg.style_tags.some((t) => tone.includes(t) || t.includes(tone))) score += 2;
      return { templateId, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);

  if (launchEntries.length > 0) {
    return launchEntries.slice(0, 3).map((item, index) => ({
      templateId: item.templateId,
      displayName: displayNameForTemplate(item.templateId),
      rank: index + 1,
      familyLabel: familyLabelForTemplate(item.templateId),
      previewHref: templatePreviewHref(item.templateId),
      score: item.score,
    }));
  }

  const entries = Object.entries(PACKAGES)
    .map(([templateId, pkg]) => {
      const reg = pkg.registry as {
        segment?: string;
        subcategory?: string;
        style_tags?: string[];
      };
      const segmentMatch = reg.segment === categoryId;
      const subMatch = reg.subcategory === subcategoryId;
      let score = 0;
      if (subMatch) score += 10;
      else if (segmentMatch) score += 4;
      if (tone && reg.style_tags?.some((t) => tone.includes(t) || t.includes(tone))) score += 2;
      return { templateId: templateId as TemplateId, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked =
    entries.length > 0
      ? entries.slice(0, 3)
      : [{ templateId: GENERIC_FALLBACK, score: 0 }];

  return picked.map((item, index) => ({
    templateId: item.templateId,
    displayName: displayNameForTemplate(item.templateId),
    rank: index + 1,
    familyLabel: familyLabelForTemplate(item.templateId),
    previewHref: templatePreviewHref(item.templateId),
    score: item.score,
  }));
}

export function buildBusinessProfilePayload(
  state: {
    categoryId: string;
    subcategoryId: string;
    description: string;
    businessProfile: Record<string, unknown>;
    logoFile: File | null;
  },
): Record<string, unknown> {
  return {
    ...state.businessProfile,
    category_id: state.categoryId,
    subcategory_id: state.subcategoryId,
    description: state.description.trim(),
    image_sourcing_mode:
      (state.businessProfile.image_sourcing_mode as ImageSourcingMode) ?? "ai_decide",
    logo_provided: Boolean(state.logoFile),
    logo_filename: state.logoFile?.name ?? null,
  };
}
