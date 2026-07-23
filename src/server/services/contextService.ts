// Port of backend/studio/services/context_service.py — project context
// hydration for reopen continuity.
//
// The Python `get_context` pulls in `onboarding_service.get_chat`, which is
// the only piece of the (much larger, LLM-driven) onboarding state machine
// this route needs — `handle_message` and the rest of onboarding_service.py
// are out of this port's scope. Rather than add an out-of-scope
// onboardingService.ts file, `get_chat`'s small read-side filter is inlined
// here verbatim (same legacy-prompt regex, same turn shape from
// conversationsRepo, which is already ported).
import { HttpError } from "../policy";
import * as assetsRepo from "../repos/assetsRepo";
import * as conversationsRepo from "../repos/conversationsRepo";
import * as editsRepo from "../repos/editsRepo";
import * as projectsRepo from "../repos/projectsRepo";
import * as templatesRepo from "../repos/templatesRepo";
import * as versionsRepo from "../repos/versionsRepo";
import * as workingHtmlRepo from "../repos/workingHtmlRepo";
import * as profileService from "./profileService";

const LEGACY_CONTACT_PROMPT_RE =
  /(what\s+email\s+address\s+would\s+you\s+like\s+people\s+to\s+use)|(what\s+phone\s+number\s+would\s+you\s+like\s+us\s+to\s+show)/i;

async function getChat(projectId: string): Promise<{ turns: conversationsRepo.Turn[] }> {
  const turns = await conversationsRepo.listTurns(projectId);
  const filtered = turns.filter((turn) => {
    if (turn.role === "assistant" && LEGACY_CONTACT_PROMPT_RE.test(String(turn.text ?? ""))) {
      return false;
    }
    return true;
  });
  return { turns: filtered };
}

export async function getContext(projectId: string): Promise<Record<string, unknown>> {
  const project = await projectsRepo.get(projectId);
  if (!project) throw new HttpError(404, "project not found");

  const [profile, working, chat, assets, templates, versions, edits] = await Promise.all([
    profileService.getProfile(projectId),
    workingHtmlRepo.get(projectId),
    getChat(projectId),
    assetsRepo.listForProject(projectId),
    templatesRepo.listForProject(projectId),
    versionsRepo.listForProject(projectId),
    editsRepo.listForProject(projectId),
  ]);

  return {
    project,
    profile,
    chat,
    assets,
    templates,
    workingHtml: working ? working.html : null,
    selectedTemplateId: working ? working.selectedTemplateId : null,
    versions,
    edits,
  };
}
