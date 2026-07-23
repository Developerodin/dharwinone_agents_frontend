"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InnerPageHeader } from "@/components/call-agent/inner-page-header";
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/call-agent/form-field";
import { IntakeProgress } from "@/components/site-intake/intake-progress";
import { SparklesIcon } from "@/components/icons";
import { ROUTES } from "@/lib/constants";
import {
  intakeGapCheck,
  intakeMatchTemplates,
  intakePrefill,
  listCategories,
} from "@/lib/intake-api";
import type {
  GapCheckQuestion,
  IntakeStepId,
  IntakeWizardState,
  MatchedTemplate,
  QuestionnaireFieldDef,
} from "@/lib/intake-types";
import {
  buildBusinessProfilePayload,
  fieldVisible,
  formatFieldValue,
  getCategoryQuestionnaire,
  getFieldOptions,
  isFieldEmpty,
  parseTagsInput,
  templatePreviewHref,
} from "@/lib/intake-utils";
import { createSite, generateSiteContent, SiteApiError } from "@/lib/site-api";
import { getSectionSchemaForTemplate } from "@/lib/site-config";
import type { CategoryRecord } from "@/lib/site-types";

const INITIAL: IntakeWizardState = {
  step: "category",
  categoryId: "",
  subcategoryId: "",
  description: "",
  businessProfile: {},
  logoFile: null,
  gapQuestions: [],
  gapAnswers: {},
  matchedTemplates: [],
  selectedTemplateId: null,
  error: null,
  apiNotes: [],
};

function noteOnce(notes: string[], message: string): string[] {
  return notes.includes(message) ? notes : [...notes, message];
}

function QuestionnaireFieldInput({
  field,
  value,
  onChange,
}: {
  field: QuestionnaireFieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="inline-flex items-center gap-2 text-sm text-defaulttextcolor">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-defaultborder text-brand-green focus:ring-brand-green"
        />
        Yes
      </label>
    );
  }

  if (field.type === "single_select" || field.type === "enum") {
    const options = getFieldOptions(field);
    return (
      <FormSelect
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((opt, index) => (
          <option key={`${field.id}-${opt.value}-${index}`} value={opt.value}>
            {opt.label || opt.value}
          </option>
        ))}
      </FormSelect>
    );
  }

  if (field.type === "tags" || field.type === "multi_select") {
    return (
      <FormTextarea
        rows={3}
        placeholder={
          field.suggestions?.length
            ? `e.g. ${field.suggestions.slice(0, 3).join(", ")}`
            : "Comma-separated values"
        }
        value={formatFieldValue(value, field.type)}
        onChange={(e) => onChange(parseTagsInput(e.target.value))}
      />
    );
  }

  return (
    <FormInput
      type={field.type === "phone" ? "tel" : "text"}
      maxLength={field.maxLength}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.label}
    />
  );
}

export function IntakeWizard() {
  const router = useRouter();
  const [state, setState] = useState<IntakeWizardState>(INITIAL);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [generateMessage, setGenerateMessage] = useState("Creating your site…");

  const selectedCategory = useMemo(
    () => categories.find((c) => c.categoryId === state.categoryId) ?? null,
    [categories, state.categoryId],
  );

  const questionnaire = useMemo(
    () => getCategoryQuestionnaire(selectedCategory),
    [selectedCategory],
  );

  const subcategories = selectedCategory?.subcategoriesJson ?? [];

  const progressLabel =
    state.step === "generating"
      ? "~30 seconds to your website"
      : questionnaire.progressLabel ?? "~30 seconds to your website";

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((rows) => {
        if (!cancelled) setCategories(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            error: err instanceof Error ? err.message : "Failed to load categories",
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = useCallback((partial: Partial<IntakeWizardState>) => {
    setState((s) => ({ ...s, ...partial, error: null }));
  }, []);

  const setProfileField = useCallback((fieldId: string, value: unknown) => {
    setState((s) => ({
      ...s,
      businessProfile: { ...s.businessProfile, [fieldId]: value },
      error: null,
    }));
  }, []);

  const canContinueCategory = Boolean(state.categoryId && state.subcategoryId);
  const canContinueDescription = state.description.trim().length >= 8;

  const requiredMissing = questionnaire.fields.filter(
    (f) =>
      f.tier === "required" &&
      fieldVisible(f, state.businessProfile) &&
      isFieldEmpty(state.businessProfile[f.id], f.type),
  );

  const runPrefill = async () => {
    setLoading(true);
    try {
      const res = await intakePrefill(
        {
          categoryId: state.categoryId,
          subcategoryId: state.subcategoryId,
          description: state.description.trim(),
        },
        selectedCategory,
      );
      patch({
        businessProfile: { ...res.businessProfile, ...state.businessProfile },
        step: "questionnaire",
        apiNotes: res.stubbed
          ? noteOnce(
              state.apiNotes,
              "Could not reach prefill API — using local fallback.",
            )
          : state.apiNotes,
      });
    } catch (err) {
      patch({
        error: err instanceof Error ? err.message : "Prefill failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const runGapCheck = async (): Promise<GapCheckQuestion[]> => {
    const profile = buildBusinessProfilePayload(state);
    const res = await intakeGapCheck(
      {
        categoryId: state.categoryId,
        subcategoryId: state.subcategoryId,
        businessProfile: profile,
      },
      selectedCategory,
    );
    if (res.stubbed) {
      patch({
        apiNotes: noteOnce(
          state.apiNotes,
          "Could not reach gap-check API — using local fallback.",
        ),
      });
    }
    return res.questions;
  };

  const runMatcher = async (
    profileOverride?: Record<string, unknown>,
  ): Promise<MatchedTemplate[]> => {
    const profile =
      profileOverride ??
      buildBusinessProfilePayload(state);
    const res = await intakeMatchTemplates({
      categoryId: state.categoryId,
      subcategoryId: state.subcategoryId,
      businessProfile: profile,
    });
    if (res.stubbed) {
      patch({
        apiNotes: noteOnce(
          state.apiNotes,
          "Could not reach template matcher — using local fallback.",
        ),
      });
    }
    return res.templates;
  };

  const goNext = async () => {
    setLoading(true);
    patch({ error: null });
    try {
      if (state.step === "category") {
        patch({ step: "description" });
        return;
      }
      if (state.step === "description") {
        await runPrefill();
        return;
      }
      if (state.step === "questionnaire") {
        if (requiredMissing.length > 0) {
          patch({ error: `Please fill required fields: ${requiredMissing.map((f) => f.label).join(", ")}` });
          return;
        }
        patch({ step: "assets" });
        return;
      }
      if (state.step === "assets") {
        const questions = await runGapCheck();
        if (questions.length > 0) {
          patch({ gapQuestions: questions, step: "gap_check" });
        } else {
          const templates = await runMatcher();
          patch({ matchedTemplates: templates, step: "templates" });
        }
        return;
      }
      if (state.step === "gap_check") {
        const unanswered = state.gapQuestions.filter((q) => !state.gapAnswers[q.fieldId]?.trim());
        if (unanswered.length > 0) {
          patch({ error: "Please answer the follow-up questions." });
          return;
        }
        const mergedProfile = { ...state.businessProfile };
        for (const q of state.gapQuestions) {
          const answer = state.gapAnswers[q.fieldId]?.trim();
          if (!answer) continue;
          if (q.fieldId === "services") mergedProfile.services = parseTagsInput(answer);
          else mergedProfile[q.fieldId] = answer;
        }
        const templates = await runMatcher(
          buildBusinessProfilePayload({ ...state, businessProfile: mergedProfile }),
        );
        patch({ businessProfile: mergedProfile, matchedTemplates: templates, step: "templates" });
        return;
      }
      if (state.step === "templates") {
        if (!state.selectedTemplateId) {
          patch({ error: "Pick a template to continue." });
          return;
        }
        await handleGenerate();
      }
    } catch (err) {
      patch({ error: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    const order: IntakeStepId[] = [
      "category",
      "description",
      "questionnaire",
      "assets",
      "gap_check",
      "templates",
    ];
    const idx = order.indexOf(state.step);
    if (idx <= 0) return;
    patch({ step: order[idx - 1], error: null });
  };

  const handleGenerate = async () => {
    if (!state.selectedTemplateId) return;
    patch({ step: "generating", error: null });
    setGenerateMessage("Creating your site…");

    const profile = buildBusinessProfilePayload(state);
    const templateId = state.selectedTemplateId;
    const sectionSchema = getSectionSchemaForTemplate(templateId);

    try {
      setGenerateMessage("Saving business profile…");
      const site = await createSite({
        businessProfileJson: profile,
        templateId,
      });

      setGenerateMessage("Generating website content (~30 seconds)…");
      const result = await generateSiteContent(site.siteId, sectionSchema);

      router.push(templatePreviewHref(templateId, result.site.siteId));
    } catch (err) {
      const message =
        err instanceof SiteApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Generation failed";
      patch({ step: "templates", error: message });
    }
  };

  const visibleQuestionnaireFields = questionnaire.fields.filter(
    (f) => fieldVisible(f, state.businessProfile) && f.id !== "image_sourcing_mode",
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <InnerPageHeader
        backHref={ROUTES.webAgent}
        backLabel="Back to Web Agent"
        title="Create a website"
        description="Smart intake — pick your trade, describe your business, and we’ll generate a draft site."
      />

      {state.step !== "generating" ? (
        <IntakeProgress current={state.step} progressLabel={progressLabel} />
      ) : null}

      {state.apiNotes.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="m-0 font-medium">Offline fallback active</p>
          <ul className="mb-0 mt-2 list-disc space-y-1 ps-5">
            {state.apiNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-defaultborder/60 bg-white p-5 shadow-sm sm:p-7">
        {state.step === "category" ? (
          <div className="space-y-5">
            <FormField label="Business category" hint="Choose the segment that best fits your business.">
              <FormSelect
                value={state.categoryId}
                onChange={(e) =>
                  patch({ categoryId: e.target.value, subcategoryId: "", businessProfile: {} })
                }
              >
                <option value="">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.name}
                  </option>
                ))}
              </FormSelect>
            </FormField>

            <FormField label="Subcategory" hint="We tailor questions and templates to your trade.">
              <FormSelect
                value={state.subcategoryId}
                disabled={!state.categoryId}
                onChange={(e) => patch({ subcategoryId: e.target.value })}
              >
                <option value="">Select subcategory…</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </FormSelect>
            </FormField>
          </div>
        ) : null}

        {state.step === "description" ? (
          <div className="space-y-4">
            <FormField
              label="Describe your business in one line"
              hint="Example: Sharma Electricals — wiring, AC repair, and emergency callouts in Pune."
            >
              <FormTextarea
                rows={3}
                value={state.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Business name, services, and city…"
              />
            </FormField>
            <p className="m-0 text-xs text-textmuted">
              We’ll use AI to pre-fill the questionnaire from this description.
            </p>
          </div>
        ) : null}

        {state.step === "questionnaire" ? (
          <div className="space-y-5">
            <p className="m-0 text-sm text-textmuted">
              Review and edit the details we pre-filled. Required fields are marked.
            </p>
            {visibleQuestionnaireFields.map((field) => (
              <FormField
                key={field.id}
                label={`${field.label}${field.tier === "required" ? " *" : ""}`}
              >
                <QuestionnaireFieldInput
                  field={field}
                  value={state.businessProfile[field.id]}
                  onChange={(v) => setProfileField(field.id, v)}
                />
              </FormField>
            ))}
          </div>
        ) : null}

        {state.step === "assets" ? (
          <div className="space-y-6">
            <FormField label="Logo (optional)" hint="Upload now or add later in the editor.">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="block w-full text-sm text-defaulttextcolor file:me-4 file:rounded-lg file:border-0 file:bg-brand-green/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-green"
                onChange={(e) => patch({ logoFile: e.target.files?.[0] ?? null })}
              />
              {state.logoFile ? (
                <p className="m-0 text-xs text-textmuted">Selected: {state.logoFile.name}</p>
              ) : null}
            </FormField>

            <FormField
              label="Website images"
              hint="Choose how section photos should be sourced."
            >
              <div className="space-y-2">
                {(
                  [
                    ["ai_decide", "Let AI decide (recommended)"],
                    ["user_provided", "I'll upload my own images"],
                    ["use_defaults", "Use default looks"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      state.businessProfile.image_sourcing_mode === value
                        ? "border-brand-green bg-brand-green/5 text-defaulttextcolor"
                        : "border-defaultborder hover:border-brand-green/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="image_sourcing_mode"
                      value={value}
                      checked={state.businessProfile.image_sourcing_mode === value}
                      onChange={() => setProfileField("image_sourcing_mode", value)}
                      className="text-brand-green focus:ring-brand-green"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </FormField>
          </div>
        ) : null}

        {state.step === "gap_check" ? (
          <div className="space-y-5">
            <p className="m-0 text-sm text-textmuted">
              A few quick follow-ups so your site doesn’t launch with gaps.
            </p>
            {state.gapQuestions.map((q) => (
              <FormField key={q.fieldId} label={q.question}>
                <FormTextarea
                  rows={2}
                  value={state.gapAnswers[q.fieldId] ?? ""}
                  onChange={(e) =>
                    patch({
                      gapAnswers: { ...state.gapAnswers, [q.fieldId]: e.target.value },
                    })
                  }
                />
              </FormField>
            ))}
          </div>
        ) : null}

        {state.step === "templates" ? (
          <div className="space-y-4">
            <p className="m-0 text-sm text-textmuted">
              Pick one of the ranked layouts. Previews use sample content — your business details
              are applied on generate.
            </p>
            <div className="grid gap-3 sm:grid-cols-1">
              {state.matchedTemplates.map((tpl) => {
                const selected = state.selectedTemplateId === tpl.templateId;
                return (
                  <button
                    key={tpl.templateId}
                    type="button"
                    onClick={() => patch({ selectedTemplateId: tpl.templateId })}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? "border-brand-green bg-brand-green/5 ring-2 ring-brand-green/20"
                        : "border-defaultborder hover:border-brand-green/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="m-0 text-xs font-medium uppercase tracking-wide text-brand-green">
                          #{tpl.rank} match
                        </p>
                        <p className="m-0 mt-1 text-base font-semibold text-defaulttextcolor">
                          {tpl.displayName}
                        </p>
                        {tpl.familyLabel ? (
                          <p className="m-0 mt-1 text-sm text-textmuted">{tpl.familyLabel}</p>
                        ) : null}
                      </div>
                      <Link
                        href={tpl.previewHref}
                        target="_blank"
                        className="shrink-0 text-xs font-medium text-brand-green no-underline hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Preview
                      </Link>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {state.step === "generating" ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green/10">
              <SparklesIcon className="h-8 w-8 text-brand-green wa-generation-sparkle" />
            </div>
            <p className="m-0 font-poppins text-lg font-semibold text-defaulttextcolor">
              {generateMessage}
            </p>
            <p className="m-0 mt-2 text-sm text-textmuted">~30 seconds to your website</p>
            <div className="mt-8 h-2 w-full max-w-md overflow-hidden rounded-full bg-[#EEF2F6]">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-green" />
            </div>
          </div>
        ) : null}
      </div>

      {state.step !== "generating" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={state.step === "category" || loading}
            className="rounded-xl border border-defaultborder px-5 py-2.5 text-sm font-medium text-defaulttextcolor transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => void goNext()}
            disabled={
              loading ||
              (state.step === "category" && !canContinueCategory) ||
              (state.step === "description" && !canContinueDescription)
            }
            className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Working…" : state.step === "templates" ? "Generate website" : "Continue"}
            {!loading && state.step === "templates" ? (
              <SparklesIcon className="h-4 w-4" />
            ) : null}
          </button>
        </div>
      ) : null}
    </div>
  );
}
