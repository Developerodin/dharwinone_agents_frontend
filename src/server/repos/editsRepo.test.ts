// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import { prisma } from "../db";
import * as editsRepo from "./editsRepo";

async function makeProject(projectId: string) {
  await prisma().builder_projects.create({ data: { projectId } });
}

beforeEach(async () => {
  await freshTestDb();
});

describe("append", () => {
  it("round-trips with the expected shape (no `id`, 12-hex editId, actor 'user')", async () => {
    await makeProject("proj-1");
    const doc = await editsRepo.append("proj-1", {
      source: "editor",
      userPrompt: "make it blue",
      actionSummary: "changed color",
      changeScope: "theme",
    });
    expect(doc).not.toHaveProperty("id");
    expect(doc.editId).toMatch(/^[0-9a-f]{12}$/);
    expect(doc.actor).toBe("user");
    expect(doc.projectId).toBe("proj-1");
    expect(doc.targets).toEqual([]);
    expect(typeof doc.ts).toBe("number");
  });

  it("defaults targets to [] and honors an explicit versionId", async () => {
    await makeProject("proj-2");
    const doc = await editsRepo.append("proj-2", {
      source: "ai",
      userPrompt: null,
      actionSummary: "rewrote hero",
      changeScope: "content",
      versionId: "v-1",
      targets: ["#hero"],
    });
    expect(doc.versionId).toBe("v-1");
    expect(doc.targets).toEqual(["#hero"]);
  });
});

describe("listForProject", () => {
  it("orders by ts desc", async () => {
    await makeProject("proj-3");
    const first = await editsRepo.append("proj-3", {
      source: "editor",
      userPrompt: "a",
      actionSummary: "a",
      changeScope: "theme",
    });
    const second = await editsRepo.append("proj-3", {
      source: "editor",
      userPrompt: "b",
      actionSummary: "b",
      changeScope: "theme",
    });
    const list = await editsRepo.listForProject("proj-3");
    expect(list.map((e) => e.editId)).toEqual([second.editId, first.editId]);
    expect(list[0]).not.toHaveProperty("id");
  });
});
