import { describe, expect, it } from "vitest";
import {
  applyGapCheckResult,
  applyPrefillResult,
  applyRecordedAnswer,
  createIntakeState,
  followUpClarification,
  followUpQuestion,
  invalidFollowUpAnswerMessage,
  isClarifyingQuestion,
  nextAction,
  normalizeFollowUpAnswer,
  type SiteChatState,
} from "@/components/web-agent/sites/siteChatMachine";

describe("siteChatMachine nextAction", () => {
  it("walks PREFILL → GAP_CHECK → ASK_FOLLOWUP → CREATE_AND_GENERATE → REWRITE_SECTION", () => {
    let state = createIntakeState("ls_electrician");
    const firstMessage = "I run Sharma Electricals in Pune";

    expect(nextAction(state, firstMessage)).toEqual({
      type: "PREFILL",
      description: firstMessage,
      category: "ls_electrician",
    });

    state = applyPrefillResult(state, { business_name: "Sharma Electricals", city: "Pune" });
    expect(nextAction(state, "")).toEqual({ type: "GAP_CHECK" });

    state = applyGapCheckResult(state, {
      complete: false,
      followUps: [
        { field: "phone", question: "What is your phone number?", tier: "required" },
        { field: "whatsapp_number", question: "WhatsApp number?", tier: "optional" },
      ],
    });
    expect(nextAction(state, "")).toEqual({
      type: "ASK_FOLLOWUP",
      followUp: { field: "phone", question: "What is your phone number?", tier: "required" },
    });

    expect(nextAction(state, "+91 98765 43210")).toEqual({
      type: "RECORD_ANSWER",
      field: "phone",
      answer: "+91 98765 43210",
    });

    state = applyRecordedAnswer(state, "phone", "+91 98765 43210");
    expect(nextAction(state, "")).toEqual({
      type: "ASK_FOLLOWUP",
      followUp: { field: "whatsapp_number", question: "WhatsApp number?", tier: "optional" },
    });

    state = applyGapCheckResult(state, { complete: true, followUps: [] });
    expect(nextAction(state, "build it")).toEqual({ type: "CREATE_AND_GENERATE" });

    const built: SiteChatState = {
      phase: "built",
      siteId: "site-abc",
      templateId: "electrician_trust_v1",
      family: "trust_local",
    };
    expect(nextAction(built, "make the hero punchier")).toEqual({
      type: "REWRITE_SECTION",
      siteId: "site-abc",
      sectionKey: "hero",
      instruction: "make the hero punchier",
    });
    expect(nextAction(built, "give me different services")).toEqual({
      type: "REGENERATE_SECTION",
      siteId: "site-abc",
      sectionKey: "services",
      instruction: "give me different services",
    });
  });

  it("clarifies cta_preference instead of recording a question as the answer", () => {
    let state = applyGapCheckResult(createIntakeState("local_service"), {
      complete: false,
      followUps: [
        {
          field: "cta_preference",
          question:
            "How should customers reach you on your site? Reply with WhatsApp, phone call, or contact form.",
          tier: "required",
        },
      ],
    });

    expect(nextAction(state, "what do you mean cta")).toEqual({
      type: "CLARIFY_FOLLOWUP",
      followUp: state.pendingFollowUps[0],
    });

    expect(nextAction(state, "phone call")).toEqual({
      type: "RECORD_ANSWER",
      field: "cta_preference",
      answer: "phone",
    });
  });

  it("re-asks when cta answer is not one of the allowed options", () => {
    const state = applyGapCheckResult(createIntakeState("local_service"), {
      complete: false,
      followUps: [
        {
          field: "cta_preference",
          question: "How should customers reach you on your site?",
          tier: "required",
        },
      ],
    });

    expect(nextAction(state, "maybe later")).toEqual({
      type: "REASK_FOLLOWUP",
      followUp: state.pendingFollowUps[0],
    });
  });
});

describe("follow-up helpers", () => {
  it("detects clarifying questions", () => {
    expect(isClarifyingQuestion("what do you mean cta")).toBe(true);
    expect(isClarifyingQuestion("WhatsApp please")).toBe(false);
  });

  it("normalizes cta answers", () => {
    expect(normalizeFollowUpAnswer("cta_preference", "WhatsApp")).toBe("whatsapp");
    expect(normalizeFollowUpAnswer("cta_preference", "phone call")).toBe("phone");
    expect(normalizeFollowUpAnswer("cta_preference", "what do you mean")).toBe(null);
  });

  it("accepts common WhatsApp typos and frustrated re-answers", () => {
    expect(normalizeFollowUpAnswer("cta_preference", "whatapp")).toBe("whatsapp");
    expect(normalizeFollowUpAnswer("cta_preference", "whasapp")).toBe("whatsapp");
    expect(normalizeFollowUpAnswer("cta_preference", "told you whatapp")).toBe("whatsapp");
    expect(normalizeFollowUpAnswer("cta_preference", "I said WhatsApp already")).toBe("whatsapp");
    expect(nextAction(
      applyGapCheckResult(createIntakeState("local_service"), {
        complete: false,
        followUps: [
          {
            field: "cta_preference",
            question: "How should customers reach you on your site?",
            tier: "required",
          },
        ],
      }),
      "whatapp",
    )).toEqual({
      type: "RECORD_ANSWER",
      field: "cta_preference",
      answer: "whatsapp",
    });
  });

  it("records array-typed fields as string[] so the backend schema keeps them", () => {
    // Regression: a free-text `services` answer stored as a string fails the
    // backend `services: z.array(...)` schema, gets dropped, and gap-check
    // re-asks forever. It must be coerced to an array on the way into profile.
    let state = applyGapCheckResult(createIntakeState("local_service"), {
      complete: false,
      followUps: [{ field: "services", question: "Which services?", tier: "required" }],
    });
    state = applyRecordedAnswer(state, "services", "photography classes");
    expect(state.profile.services).toEqual(["photography classes"]);

    state = applyRecordedAnswer(state, "services", "wiring, AC repair and rewiring");
    expect(state.profile.services).toEqual(["wiring", "AC repair", "rewiring"]);
  });

  it("uses plain-language follow-up copy", () => {
    const followUp = {
      field: "cta_preference",
      question: "How should customers reach you on your site?",
      tier: "required",
      hint: "Preferred CTA",
    };
    expect(followUpQuestion(followUp)).toBe("How should customers reach you on your site?");
    expect(followUpClarification(followUp)).toMatch(/CTA means the main button/i);
    expect(invalidFollowUpAnswerMessage(followUp)).toMatch(/WhatsApp, phone call, or contact form/i);
  });
});
