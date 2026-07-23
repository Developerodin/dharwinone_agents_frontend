// @vitest-environment node
// Port of the relevant cases from backend/studio/tests/test_working_html_repo.py
// (size limit, full-document validation, sanitize-on-write, upsert-on-projectId).
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import { prisma } from "../db";
import * as workingHtmlRepo from "./workingHtmlRepo";

beforeEach(async () => {
  await freshTestDb();
  await prisma().builder_projects.create({ data: { projectId: "p-1", projectName: "Test" } });
});

describe("put/get", () => {
  it("round-trips working html, sanitizing on the way in", async () => {
    const dirty =
      '<html><body><button onclick="alert(1)">x</button>' +
      "<script>alert(1)</script><h1>Hi</h1></body></html>";
    await workingHtmlRepo.put("p-1", dirty, { templateId: "tmpl-1" });

    const doc = await workingHtmlRepo.get("p-1");
    expect(doc).not.toBeNull();
    expect(doc!.html as string).not.toContain("<script>");
    expect(doc!.html as string).not.toContain("onclick");
    expect(doc!.html as string).toContain("<h1>Hi</h1>");
    expect(doc!.selectedTemplateId).toBe("tmpl-1");
  });

  it("upserts on projectId — a second put replaces rather than appends", async () => {
    await workingHtmlRepo.put("p-1", "<html><body><h1>First</h1></body></html>");
    await workingHtmlRepo.put("p-1", "<html><body><h1>Second</h1></body></html>");

    const doc = await workingHtmlRepo.get("p-1");
    expect(doc!.html as string).toContain("Second");
    expect(doc!.html as string).not.toContain("First");

    const rows = await prisma().builder_working_html.findMany({ where: { projectId: "p-1" } });
    expect(rows).toHaveLength(1);
  });

  it("returns null when nothing is stored for the project", async () => {
    expect(await workingHtmlRepo.get("no-such-project")).toBeNull();
  });
});

describe("size and shape validation", () => {
  it("rejects html over 512KB", async () => {
    const big = "<html><body>" + "a".repeat(512 * 1024) + "</body></html>";
    await expect(workingHtmlRepo.put("p-1", big)).rejects.toThrow(workingHtmlRepo.WorkingHtmlError);
  });

  it("rejects html that isn't a full document", async () => {
    await expect(workingHtmlRepo.put("p-1", "<div>not a document</div>")).rejects.toThrow(
      workingHtmlRepo.WorkingHtmlError,
    );
  });
});

describe("requireHtml", () => {
  it("returns the html when present", async () => {
    await workingHtmlRepo.put("p-1", "<html><body><h1>Hi</h1></body></html>");
    expect(await workingHtmlRepo.requireHtml("p-1")).toContain("<h1>Hi</h1>");
  });

  it("throws WorkingHtmlError when no working html exists for the project", async () => {
    await expect(workingHtmlRepo.requireHtml("p-1")).rejects.toThrow(workingHtmlRepo.WorkingHtmlError);
  });
});
