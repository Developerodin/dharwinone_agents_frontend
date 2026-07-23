// @vitest-environment node
// Port-fidelity tests for contextService (port of
// backend/studio/services/context_service.py get_context), including the
// inlined onboarding_service.get_chat legacy-prompt filter.
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import * as conversationsRepo from "../repos/conversationsRepo";
import * as projectsRepo from "../repos/projectsRepo";
import * as versionsRepo from "../repos/versionsRepo";
import * as workingHtmlRepo from "../repos/workingHtmlRepo";
import * as contextService from "./contextService";

let projectId: string;

beforeEach(async () => {
  await freshTestDb();
  const project = await projectsRepo.create("Context Co", "Build site");
  projectId = project.projectId;
});

describe("getContext", () => {
  it("hydrates project, profile, chat, assets, templates, versions, edits", async () => {
    await workingHtmlRepo.put(projectId, "<html><body><h1>Hi</h1></body></html>", { templateId: "tmpl-1" });
    await versionsRepo.create(projectId, { label: "v1", trigger: "manual", html: "<html><body>1</body></html>" });
    await conversationsRepo.appendTurn(projectId, "user", "hello");
    await conversationsRepo.appendTurn(projectId, "assistant", "hi there!");

    const ctx = await contextService.getContext(projectId);
    expect((ctx.project as Record<string, unknown>).projectId).toBe(projectId);
    expect((ctx.profile as Record<string, unknown>).projectId).toBe(projectId);
    expect(ctx.workingHtml).toContain("<h1>Hi</h1>");
    expect(ctx.selectedTemplateId).toBe("tmpl-1");
    expect(Array.isArray(ctx.versions)).toBe(true);
    expect((ctx.versions as unknown[]).length).toBe(1);
    expect(Array.isArray(ctx.assets)).toBe(true);
    expect(Array.isArray(ctx.templates)).toBe(true);
    expect(Array.isArray(ctx.edits)).toBe(true);
    const chat = ctx.chat as { turns: Array<Record<string, unknown>> };
    expect(chat.turns.map((t) => t.text)).toEqual(["hello", "hi there!"]);
  });

  it("filters out legacy contact-prompt assistant turns from chat", async () => {
    await conversationsRepo.appendTurn(
      projectId,
      "assistant",
      "What email address would you like people to use?",
    );
    await conversationsRepo.appendTurn(projectId, "assistant", "What's your brand name?");
    const ctx = await contextService.getContext(projectId);
    const chat = ctx.chat as { turns: Array<Record<string, unknown>> };
    expect(chat.turns).toHaveLength(1);
    expect(chat.turns[0].text).toBe("What's your brand name?");
  });

  it("returns null workingHtml/selectedTemplateId when nothing is stored", async () => {
    const ctx = await contextService.getContext(projectId);
    expect(ctx.workingHtml).toBeNull();
    expect(ctx.selectedTemplateId).toBeNull();
  });

  it("404s for a missing project", async () => {
    await expect(contextService.getContext("no-such-project")).rejects.toMatchObject({ status: 404 });
  });
});
