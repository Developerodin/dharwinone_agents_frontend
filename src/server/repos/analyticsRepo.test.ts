// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import { prisma } from "../db";
import * as analyticsRepo from "./analyticsRepo";

async function makeProject(projectId: string) {
  await prisma().builder_projects.create({ data: { projectId } });
}

beforeEach(async () => {
  await freshTestDb();
});

describe("track", () => {
  it("round-trips with the expected shape (no `id`, 12-hex eventId, metadata default {})", async () => {
    await makeProject("proj-1");
    const doc = await analyticsRepo.track("proj-1", "page_view");
    expect(doc).not.toHaveProperty("id");
    expect(doc.eventId).toMatch(/^[0-9a-f]{12}$/);
    expect(doc.projectId).toBe("proj-1");
    expect(doc.eventType).toBe("page_view");
    expect(doc.metadata).toEqual({});
    expect(typeof doc.ts).toBe("number");
  });

  it("stores provided metadata", async () => {
    await makeProject("proj-2");
    const doc = await analyticsRepo.track("proj-2", "click", { target: "#cta" });
    expect(doc.metadata).toEqual({ target: "#cta" });
  });
});

describe("listForProject", () => {
  it("orders by ts desc", async () => {
    await makeProject("proj-3");
    const first = await analyticsRepo.track("proj-3", "page_view");
    const second = await analyticsRepo.track("proj-3", "click");
    const list = await analyticsRepo.listForProject("proj-3");
    expect(list.map((e) => e.eventId)).toEqual([second.eventId, first.eventId]);
    expect(list[0]).not.toHaveProperty("id");
  });
});

describe("summarize", () => {
  it("counts events by eventType and reports the total", async () => {
    await makeProject("proj-4");
    await analyticsRepo.track("proj-4", "page_view");
    await analyticsRepo.track("proj-4", "page_view");
    await analyticsRepo.track("proj-4", "click");

    const summary = await analyticsRepo.summarize("proj-4");
    expect(summary.projectId).toBe("proj-4");
    expect(summary.counts).toEqual({ page_view: 2, click: 1 });
    expect(summary.total).toBe(3);
  });

  it("returns zero counts for a project with no events", async () => {
    await makeProject("proj-5");
    const summary = await analyticsRepo.summarize("proj-5");
    expect(summary.counts).toEqual({});
    expect(summary.total).toBe(0);
  });
});
