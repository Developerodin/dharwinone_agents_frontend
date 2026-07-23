import { newIdempotencyKey, resetIdempotencyKey } from "@/lib/idempotency";
import {
  createSite,
  gapCheck,
  generateSite,
  getTemplateSchema,
  getTemplateStyleTags,
  matchTemplates,
  patchSite,
  prefillIntake,
  regenerateSection,
  rewriteSection,
  SitesApiError,
} from "@/lib/sites-api";
import type { FamilyId } from "@/lib/sites-types";
import type { WebProject } from "@/lib/web-agent-data";
import { inferCategory, type CategoryInput } from "@/components/web-agent/sites/inferCategory";
import { generationErrorMessage } from "@/components/web-agent/sites/GenerationErrorBubble";
import {
  applyGapCheckResult,
  applyPrefillResult,
  applyRecordedAnswer,
  createIntakeState,
  followUpClarification,
  followUpQuestion,
  invalidFollowUpAnswerMessage,
  nextAction,
  type OrchestratorAction,
  type SiteChatState,
} from "@/components/web-agent/sites/siteChatMachine";
import { familyFromTemplateMeta, seedThemeJson } from "@/components/web-agent/sites/seedTheme";
import { PACKAGES, type TemplateId } from "@/templates/packages";
import type { SiteTheme } from "@/templates/system/types";

export type SiteChatTurnResult = {
  project: WebProject;
  state: SiteChatState;
  assistantMessages: string[];
  previewBump: boolean;
  usedFallback?: boolean;
};

function slugifySubdomain(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `site-${Date.now().toString(36)}`;
}

function bumpPreview(project: WebProject): WebProject {
  return {
    ...project,
    previewVersion: (project.previewVersion ?? 0) + 1,
  };
}

async function resolveTemplateFamily(templateId: string): Promise<FamilyId> {
  try {
    const styleTags = await getTemplateStyleTags(templateId);
    return familyFromTemplateMeta(templateId, styleTags);
  } catch {
    return familyFromTemplateMeta(templateId);
  }
}

async function executeAction(
  action: OrchestratorAction,
  state: SiteChatState,
  project: WebProject,
): Promise<{
  state: SiteChatState;
  project: WebProject;
  messages: string[];
  previewBump: boolean;
  usedFallback?: boolean;
  followUp?: boolean;
}> {
  switch (action.type) {
    case "PREFILL": {
      const intakeState = state as Extract<SiteChatState, { phase: "intake" }>;
      const subcategory =
        typeof intakeState.profile.subcategory === "string"
          ? intakeState.profile.subcategory
          : undefined;
      const result = await prefillIntake({
        description: action.description,
        category: action.category,
        subcategory,
      });
      const intake = applyPrefillResult(intakeState, result.businessProfile);
      return {
        state: intake,
        project,
        messages: ["Thanks — I pulled out the basics from your description."],
        previewBump: false,
      };
    }
    case "GAP_CHECK": {
      const intake = state as Extract<SiteChatState, { phase: "intake" }>;
      const result = await gapCheck({
        businessProfile: intake.profile,
        categoryId: intake.category,
      });
      const nextIntake = applyGapCheckResult(intake, result);
      if (result.complete || result.followUps.length === 0) {
        return {
          state: nextIntake,
          project,
          messages: ["Looks good — I have enough to build your site."],
          previewBump: false,
        };
      }
      const followUp = result.followUps[0];
      return {
        state: nextIntake,
        project,
        messages: [followUpQuestion(followUp)],
        previewBump: false,
        followUp: true,
      };
    }
    case "ASK_FOLLOWUP":
      return {
        state,
        project,
        messages: [followUpQuestion(action.followUp)],
        previewBump: false,
        followUp: true,
      };
    case "CLARIFY_FOLLOWUP":
      return {
        state,
        project,
        messages: [followUpClarification(action.followUp)],
        previewBump: false,
        followUp: true,
      };
    case "REASK_FOLLOWUP":
      return {
        state,
        project,
        messages: [invalidFollowUpAnswerMessage(action.followUp)],
        previewBump: false,
        followUp: true,
      };
    case "RECORD_ANSWER": {
      const intake = applyRecordedAnswer(
        state as Extract<SiteChatState, { phase: "intake" }>,
        action.field,
        action.answer,
      );
      if (intake.pendingFollowUps.length === 0) {
        const gap = await gapCheck({
          businessProfile: intake.profile,
          categoryId: intake.category,
        });
        const afterGap = applyGapCheckResult(intake, gap);
        if (gap.complete || gap.followUps.length === 0) {
          return {
            state: afterGap,
            project,
            messages: ["Got it — building your site now."],
            previewBump: false,
          };
        }
        return {
          state: afterGap,
          project,
          messages: [followUpQuestion(gap.followUps[0])],
          previewBump: false,
          followUp: true,
        };
      }
      return {
        state: intake,
        project,
        messages: [followUpQuestion(intake.pendingFollowUps[0])],
        previewBump: false,
        followUp: true,
      };
    }
    case "CREATE_AND_GENERATE": {
      const intake = state as Extract<SiteChatState, { phase: "intake" }>;
      const businessName =
        String(intake.profile.business_name ?? intake.profile.name ?? project.name).trim() ||
        project.name;
      const subdomain = slugifySubdomain(businessName);
      const created = await createSite({
        businessProfileJson: intake.profile,
        subdomain,
      });
      const matches = await matchTemplates({ businessProfile: intake.profile });
      const templateId = matches.matches[0]?.templateId ?? created.templateId ?? null;
      const family = templateId ? await resolveTemplateFamily(templateId) : "trust_local";
      const { sections, schema } = templateId
        ? await getTemplateSchema(templateId)
        : { sections: undefined, schema: {} as Record<string, unknown> };
      const themeJson = seedThemeJson({
        family,
        sectionOrder: sections,
        brandPrimary:
          typeof intake.profile.brand_color === "string"
            ? intake.profile.brand_color
            : undefined,
        packageBrand:
          templateId && templateId in PACKAGES
            ? (() => {
                const b = (PACKAGES[templateId as TemplateId].theme as SiteTheme).brand;
                return {
                  primary: b.primary,
                  accent: b.accent,
                  neutral: b.neutral,
                  bg: b.bg,
                  surface: b.surface,
                };
              })()
            : undefined,
      });
      await patchSite(created.siteId, {
        themeJson,
        templateId: templateId ?? undefined,
        subdomain,
      });
      resetIdempotencyKey(created.siteId, "generate");
      const idempotencyKey = newIdempotencyKey(created.siteId, "generate");
      const generated = await generateSite(created.siteId, {
        sectionSchema: schema,
        idempotencyKey,
      });
      const built: SiteChatState = {
        phase: "built",
        siteId: created.siteId,
        templateId: templateId ?? undefined,
        family,
      };
      const nextProject: WebProject = bumpPreview({
        ...project,
        id: created.siteId,
        name: businessName,
        siteId: created.siteId,
        subdomain: generated.site.subdomain ?? subdomain,
        templateId: templateId ?? generated.site.templateId,
        family,
        status: "generated",
      });
      return {
        state: built,
        project: nextProject,
        messages: generated.usedFallback
          ? [
              "Generated a starter version — want me to refine it?",
              "Your site is ready in the preview panel.",
            ]
          : ["Your site is ready in the preview panel."],
        previewBump: true,
        usedFallback: generated.usedFallback,
      };
    }
    case "REWRITE_SECTION": {
      resetIdempotencyKey(action.siteId, `rewrite:${action.sectionKey}`);
      const idempotencyKey = newIdempotencyKey(action.siteId, `rewrite:${action.sectionKey}`);
      await rewriteSection(action.siteId, action.sectionKey, {
        instruction: action.instruction,
        idempotencyKey,
      });
      return {
        state: { phase: "editing", siteId: action.siteId, templateId: project.templateId ?? undefined, family: project.family },
        project: bumpPreview({ ...project, status: "generated" }),
        messages: [`Updated the ${action.sectionKey.replace(/_/g, " ")} section.`],
        previewBump: true,
      };
    }
    case "REGENERATE_SECTION": {
      resetIdempotencyKey(action.siteId, `regenerate:${action.sectionKey}`);
      const idempotencyKey = newIdempotencyKey(action.siteId, `regenerate:${action.sectionKey}`);
      await regenerateSection(action.siteId, action.sectionKey, {
        idempotencyKey,
        instruction: action.instruction,
      });
      return {
        state: { phase: "editing", siteId: action.siteId, templateId: project.templateId ?? undefined, family: project.family },
        project: bumpPreview({ ...project, status: "generated" }),
        messages: [`Regenerated the ${action.sectionKey.replace(/_/g, " ")} section.`],
        previewBump: true,
      };
    }
    case "PATCH_THEME": {
      const family = project.family ?? "trust_local";
      const themeJson = seedThemeJson({ family });
      await patchSite(action.siteId, { themeJson });
      return {
        state: { phase: "editing", siteId: action.siteId, templateId: project.templateId ?? undefined, family },
        project: bumpPreview({ ...project, status: "generated" }),
        messages: ["Applied an updated theme to your site."],
        previewBump: true,
      };
    }
    default:
      return { state, project, messages: [], previewBump: false };
  }
}

export async function runSiteChatTurn(params: {
  project: WebProject;
  state: SiteChatState | null;
  userMessage: string;
  categories: CategoryInput[];
}): Promise<SiteChatTurnResult> {
  let state =
    params.state ??
    (params.project.siteId
      ? ({
          phase: "built",
          siteId: params.project.siteId,
          templateId: params.project.templateId ?? undefined,
          family: params.project.family,
        } satisfies SiteChatState)
      : null);

  let project = params.project;
  const assistantMessages: string[] = [];

  if (!state) {
    const inferred = await inferCategory(params.userMessage, params.categories);
    const categoryId =
      inferred.categoryId ??
      params.categories[0]?.categoryId ??
      "generic";
    state = createIntakeState(categoryId);
    if (inferred.categoryId || inferred.subcategoryId) {
      state = {
        ...state,
        profile: {
          ...state.profile,
          ...(inferred.categoryId ? { category: inferred.categoryId } : {}),
          ...(inferred.subcategoryId ? { subcategory: inferred.subcategoryId } : {}),
        },
      };
    }
    if (!inferred.categoryId && params.categories.length > 1) {
      const names = params.categories
        .slice(0, 4)
        .map((row) => row.name)
        .join(", ");
      assistantMessages.push(
        `I couldn't tell your business category yet — I'll use ${params.categories[0]?.name ?? "general"} for now. You can mention if you're in: ${names}.`,
      );
    }
  }
  let previewBump = false;
  let usedFallback: boolean | undefined;

  let action = nextAction(state, params.userMessage);
  let guard = 0;

  while (action.type !== "NOOP" && guard < 12) {
    guard += 1;
    const executedType = action.type;
    try {
      const result = await executeAction(action, state, project);
      state = result.state;
      project = result.project;
      assistantMessages.push(...result.messages);
      previewBump = previewBump || result.previewBump;
      if (result.usedFallback) usedFallback = true;
      if (result.followUp) break;
      if (executedType === "CREATE_AND_GENERATE") break;
      action = nextAction(state, "");
    } catch (err) {
      if (err instanceof SitesApiError) {
        assistantMessages.push(generationErrorMessage(err, usedFallback));
      } else {
        assistantMessages.push(
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
        );
      }
      break;
    }
  }

  return {
    project,
    state,
    assistantMessages: assistantMessages.filter(Boolean),
    previewBump,
    usedFallback,
  };
}
