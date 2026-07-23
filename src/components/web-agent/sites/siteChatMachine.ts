import type { FamilyId, FollowUp } from "@/lib/sites-types";

export type SiteChatState =
  | {
      phase: "intake";
      profile: Record<string, unknown>;
      category: string;
      pendingFollowUps: FollowUp[];
      awaitingField: string | null;
      prefillDone: boolean;
      gapComplete: boolean;
    }
  | { phase: "generating"; siteId?: string }
  | { phase: "built"; siteId: string; templateId?: string; family?: FamilyId }
  | { phase: "editing"; siteId: string; templateId?: string; family?: FamilyId };

export type OrchestratorAction =
  | { type: "PREFILL"; description: string; category: string }
  | { type: "GAP_CHECK" }
  | { type: "ASK_FOLLOWUP"; followUp: FollowUp }
  | { type: "CLARIFY_FOLLOWUP"; followUp: FollowUp }
  | { type: "REASK_FOLLOWUP"; followUp: FollowUp }
  | { type: "RECORD_ANSWER"; field: string; answer: string }
  | { type: "CREATE_AND_GENERATE" }
  | { type: "REWRITE_SECTION"; siteId: string; sectionKey: string; instruction: string }
  | { type: "REGENERATE_SECTION"; siteId: string; sectionKey: string; instruction?: string }
  | { type: "PATCH_THEME"; siteId: string; instruction: string }
  | { type: "NOOP" };

const CLARIFYING_QUESTION_PATTERN =
  /\b(what do you mean|what does .* mean|what is|what's|whats|explain|help me understand|don't understand|dont understand|not sure what|can you clarify|what are my options|which one|i don't know what|idk what)\b/i;

const CTA_ALIASES: Record<string, "whatsapp" | "phone" | "form"> = {
  whatsapp: "whatsapp",
  wa: "whatsapp",
  "whats app": "whatsapp",
  chat: "whatsapp",
  phone: "phone",
  call: "phone",
  "phone call": "phone",
  telephone: "phone",
  form: "form",
  "contact form": "form",
  email: "form",
  message: "form",
};

const CTA_PREAMBLE_PATTERN =
  /^(?:i\s+(?:said|want|pick|choose|meant)|told\s+you|use|pick|choose|go\s+with|just|only|already)\s+/i;

/** Common misspellings + spaced variants, e.g. "whatapp", "whasapp". */
const WHATSAPP_TYPO_PATTERN =
  /\b(?:whats?\s*app|what\s*app|what?s?app|whatapp|watsapp|whasapp|whatsap)\b/i;

const PHONE_INTENT_PATTERN = /\b(?:phone\s*call|telephone|call\s*me|mobile)\b|\bphone\b/i;

const FORM_INTENT_PATTERN = /\b(?:contact\s*form|web\s*form|email\s*form)\b|\bform\b/i;

function stripCtaPreamble(text: string): string {
  let cleaned = text.trim();
  for (let i = 0; i < 3; i += 1) {
    const next = cleaned.replace(CTA_PREAMBLE_PATTERN, "").replace(/\b(?:please|thanks|already)\b/gi, " ").replace(/\s+/g, " ").trim();
    if (next === cleaned) break;
    cleaned = next;
  }
  return cleaned;
}

function normalizeCtaPreference(raw: string): "whatsapp" | "phone" | "form" | null {
  const lower = stripCtaPreamble(raw)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!lower) return null;

  if (CTA_ALIASES[lower]) return CTA_ALIASES[lower];
  for (const [alias, value] of Object.entries(CTA_ALIASES)) {
    if (lower.includes(alias)) return value;
  }

  if (WHATSAPP_TYPO_PATTERN.test(lower)) return "whatsapp";
  if (PHONE_INTENT_PATTERN.test(lower)) return "phone";
  if (FORM_INTENT_PATTERN.test(lower)) return "form";

  return null;
}

export function isClarifyingQuestion(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (CLARIFYING_QUESTION_PATTERN.test(trimmed)) return true;
  return trimmed.endsWith("?") && trimmed.split(/\s+/).length <= 8;
}

export function normalizeFollowUpAnswer(field: string, answer: string): string | null {
  const trimmed = answer.trim();
  if (!trimmed) return null;

  if (field === "cta_preference") {
    return normalizeCtaPreference(trimmed);
  }

  if (field === "business_name") {
    if (trimmed.length < 2) return null;
    if (/\b(website|web site|what do you mean)\b/i.test(trimmed)) return null;
  }

  if (field === "email") {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    return ok ? trimmed.toLowerCase() : null;
  }

  return trimmed;
}

const SECTION_ALIASES: Record<string, string> = {
  hero: "hero",
  headline: "hero",
  services: "services",
  service: "services",
  about: "about",
  testimonials: "testimonials",
  reviews: "testimonials",
  testimonial: "testimonials",
  pricing: "pricing",
  faq: "faq",
  contact: "contact",
  footer: "cta_footer",
  cta: "cta_footer",
  "why us": "why_us",
  why_us: "why_us",
  gallery: "gallery",
};

const REGENERATE_PATTERN =
  /\b(regenerat(?:e|ing)|different|new version|fresh|redo|replace entirely|start over)\b/i;
const REWRITE_PATTERN =
  /\b(rewrite|reword|punchier|shorter|longer|improve|update copy|change text|make the)\b/i;
const THEME_PATTERN = /\b(theme|color|palette|font|style|branding|look and feel)\b/i;
const GENERATE_PATTERN =
  /\b(generate|build it|create it|go ahead|proceed|start generation|make the site)\b/i;

export function createIntakeState(category: string): Extract<SiteChatState, { phase: "intake" }> {
  return {
    phase: "intake",
    profile: {},
    category,
    pendingFollowUps: [],
    awaitingField: null,
    prefillDone: false,
    gapComplete: false,
  };
}

function detectSection(message: string): string {
  const lower = message.toLowerCase();
  for (const [alias, key] of Object.entries(SECTION_ALIASES)) {
    if (lower.includes(alias)) return key;
  }
  return "hero";
}

function classifyEdit(message: string, siteId: string): OrchestratorAction {
  const instruction = message.trim();
  const sectionKey = detectSection(instruction);

  if (THEME_PATTERN.test(instruction)) {
    return { type: "PATCH_THEME", siteId, instruction };
  }
  if (REGENERATE_PATTERN.test(instruction)) {
    return { type: "REGENERATE_SECTION", siteId, sectionKey, instruction };
  }
  if (REWRITE_PATTERN.test(instruction)) {
    return { type: "REWRITE_SECTION", siteId, sectionKey, instruction };
  }
  return { type: "REWRITE_SECTION", siteId, sectionKey, instruction };
}

export function nextAction(state: SiteChatState, userMessage: string): OrchestratorAction {
  const message = userMessage.trim();

  if (state.phase === "built" || state.phase === "editing") {
    if (!message) return { type: "NOOP" };
    return classifyEdit(message, state.siteId);
  }

  if (state.phase === "generating") {
    return { type: "NOOP" };
  }

  if (state.phase === "intake") {
    if (state.awaitingField && message) {
      const followUp =
        state.pendingFollowUps.find((row) => row.field === state.awaitingField) ??
        ({
          field: state.awaitingField,
          question: "",
          tier: "required",
        } satisfies FollowUp);

      if (isClarifyingQuestion(message)) {
        return { type: "CLARIFY_FOLLOWUP", followUp };
      }

      const normalized = normalizeFollowUpAnswer(state.awaitingField, message);
      if (normalized === null) {
        return { type: "REASK_FOLLOWUP", followUp };
      }

      return { type: "RECORD_ANSWER", field: state.awaitingField, answer: normalized };
    }

    if (state.gapComplete && GENERATE_PATTERN.test(message)) {
      return { type: "CREATE_AND_GENERATE" };
    }

    if (state.gapComplete) {
      return { type: "CREATE_AND_GENERATE" };
    }

    if (state.pendingFollowUps.length > 0 && state.awaitingField && !message) {
      const followUp = state.pendingFollowUps.find((row) => row.field === state.awaitingField);
      if (followUp) return { type: "ASK_FOLLOWUP", followUp };
    }

    if (state.prefillDone && !state.gapComplete && !state.awaitingField && !message) {
      return { type: "GAP_CHECK" };
    }

    if (!state.prefillDone && message) {
      return { type: "PREFILL", description: message, category: state.category };
    }
  }

  return { type: "NOOP" };
}

export function applyGapCheckResult(
  state: Extract<SiteChatState, { phase: "intake" }>,
  result: { complete: boolean; followUps: FollowUp[] },
): Extract<SiteChatState, { phase: "intake" }> {
  if (result.complete || result.followUps.length === 0) {
    return {
      ...state,
      pendingFollowUps: [],
      awaitingField: null,
      gapComplete: true,
    };
  }
  return {
    ...state,
    pendingFollowUps: result.followUps,
    awaitingField: result.followUps[0]?.field ?? null,
    gapComplete: false,
  };
}

// Backend BusinessProfileSchema types these as string[]; a raw string answer is
// dropped by the lenient partial-parse and gap-check re-asks forever. Split here.
const ARRAY_FIELDS = new Set(["services", "service_area"]);

export function applyRecordedAnswer(
  state: Extract<SiteChatState, { phase: "intake" }>,
  field: string,
  answer: string,
): Extract<SiteChatState, { phase: "intake" }> {
  const pendingFollowUps = state.pendingFollowUps.filter((row) => row.field !== field);
  const value: string | string[] = ARRAY_FIELDS.has(field)
    ? answer.split(/[,;\n]|\band\b/i).map((s) => s.trim()).filter(Boolean)
    : answer;
  return {
    ...state,
    profile: { ...state.profile, [field]: value },
    pendingFollowUps,
    awaitingField: pendingFollowUps[0]?.field ?? null,
  };
}

export function applyPrefillResult(
  state: Extract<SiteChatState, { phase: "intake" }>,
  profile: Record<string, unknown>,
): Extract<SiteChatState, { phase: "intake" }> {
  return {
    ...state,
    profile: { ...state.profile, ...profile },
    prefillDone: true,
  };
}

export function followUpQuestion(followUp: FollowUp): string {
  if (followUp.field === "cta_preference") {
    return (
      followUp.question ||
      "How should customers reach you on your site? Reply with WhatsApp, phone call, or contact form."
    );
  }
  if (followUp.field === "business_name") {
    return (
      followUp.question ||
      "What's the name of your business? This appears on your site header and contact sections."
    );
  }
  if (followUp.field === "phone") {
    return (
      followUp.question ||
      "What phone number should customers call? Include country code if helpful."
    );
  }
  if (followUp.field === "email") {
    return (
      followUp.question ||
      "What email address should customers use to reach you?"
    );
  }
  return followUp.hint ? `${followUp.question} (${followUp.hint})` : followUp.question;
}

export function followUpClarification(followUp: FollowUp): string {
  if (followUp.field === "cta_preference") {
    return (
      "CTA means the main button visitors use to contact you. Pick one: " +
      "WhatsApp (chat button), phone call (tap-to-call), or contact form (message form). Which works best?"
    );
  }
  if (followUp.field === "business_name") {
    return "I need your actual business or restaurant name — for example, \"Spice Garden\" or \"Joe's Plumbing\".";
  }
  return `Happy to clarify — ${followUpQuestion(followUp)}`;
}

export function invalidFollowUpAnswerMessage(followUp: FollowUp): string {
  if (followUp.field === "cta_preference") {
    return "Pick one contact option — just reply WhatsApp, phone call, or contact form (spelling doesn't need to be perfect).";
  }
  if (followUp.field === "business_name") {
    return "Please share your business name — just the name customers would recognize.";
  }
  if (followUp.field === "email") {
    return "Please share a valid email address — for example, hello@yourbusiness.com.";
  }
  return `I didn't catch that — ${followUpQuestion(followUp)}`;
}
