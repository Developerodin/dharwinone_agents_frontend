// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import { prisma } from "../db";
import * as conversationsRepo from "./conversationsRepo";

async function makeProject(projectId: string) {
  await prisma().builder_projects.create({ data: { projectId } });
}

beforeEach(async () => {
  await freshTestDb();
});

describe("ensure", () => {
  it("creates the row with turns: [] when missing and returns the plain doc shape", async () => {
    await makeProject("proj-1");
    const doc = await conversationsRepo.ensure("proj-1");
    expect(doc).not.toHaveProperty("id");
    expect(doc.projectId).toBe("proj-1");
    expect(doc.turns).toEqual([]);
  });

  it("is idempotent — returns the same row on a second call", async () => {
    await makeProject("proj-2");
    await conversationsRepo.ensure("proj-2");
    await conversationsRepo.appendTurn("proj-2", "user", "hi");
    const doc = await conversationsRepo.ensure("proj-2");
    expect(doc.turns).toHaveLength(1);
    const rows = await prisma().conversations.findMany({ where: { projectId: "proj-2" } });
    expect(rows).toHaveLength(1);
  });
});

describe("appendTurn", () => {
  it("appends turns in order across two calls (full reassignment, no mutation)", async () => {
    await makeProject("proj-3");
    const first = await conversationsRepo.appendTurn("proj-3", "user", "hello", { foo: "bar" });
    expect(first.role).toBe("user");
    expect(first.text).toBe("hello");
    expect(first.meta).toEqual({ foo: "bar" });
    expect(typeof first.ts).toBe("number");

    const second = await conversationsRepo.appendTurn("proj-3", "assistant", "hi there");
    expect(second.meta).toEqual({});

    const turns = await conversationsRepo.listTurns("proj-3");
    expect(turns).toHaveLength(2);
    expect(turns[0].text).toBe("hello");
    expect(turns[1].text).toBe("hi there");
  });
});

describe("listTurns", () => {
  it("returns [] when the conversation does not exist yet (ensure creates it)", async () => {
    await makeProject("proj-4");
    const turns = await conversationsRepo.listTurns("proj-4");
    expect(turns).toEqual([]);
  });
});
