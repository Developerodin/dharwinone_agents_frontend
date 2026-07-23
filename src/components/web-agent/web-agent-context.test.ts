import { describe, expect, it } from "vitest";
import type { WebProject } from "@/lib/web-agent-data";
import { mergeRemoteProjects } from "./web-agent-context";

function siteProject(overrides: Partial<WebProject> = {}): WebProject {
  return {
    id: "site-13",
    siteId: "site-13",
    kind: "site",
    name: "Iron Leaf Fitness",
    description: "Gym in Jaipur",
    status: "generated",
    prompt: "Gym in Jaipur",
    createdAt: "2026-07-23T10:00:00.000Z",
    updatedAt: "2026-07-23T10:05:00.000Z",
    versions: [],
    chatHistory: [],
    uploadedAssets: [],
    ...overrides,
  };
}

describe("mergeRemoteProjects", () => {
  it("includes API sites alongside builder projects", () => {
    const builder = [
      {
        id: "proj-1",
        kind: "builder" as const,
        name: "Builder One",
        description: "Old flow",
        status: "generated" as const,
        prompt: "Old flow",
        createdAt: "2026-07-22T10:00:00.000Z",
        updatedAt: "2026-07-22T10:00:00.000Z",
        versions: [],
        chatHistory: [],
        uploadedAssets: [],
      },
    ];
    const merged = mergeRemoteProjects(builder, [siteProject()], []);
    expect(merged.map((p) => p.id).sort()).toEqual(["proj-1", "site-13"]);
  });

  it("preserves local chat history when the same site returns from the API", () => {
    const local = siteProject({
      chatHistory: [{ id: "m1", role: "user", content: "Gym in Jaipur", timestamp: "2026-07-23T10:00:00.000Z" }],
      previewVersion: 2,
    });
    const merged = mergeRemoteProjects([], [siteProject()], [local]);
    expect(merged[0].chatHistory).toHaveLength(1);
    expect(merged[0].previewVersion).toBe(2);
  });

  it("keeps in-flight local site shells that do not have a siteId yet", () => {
    const pending = siteProject({
      id: "site-local-uuid",
      siteId: undefined,
      status: "draft",
    });
    const merged = mergeRemoteProjects([], [], [pending]);
    expect(merged.some((p) => p.id === "site-local-uuid")).toBe(true);
  });
});
