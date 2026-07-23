// @vitest-environment node
// Port of the relevant cases from backend/studio/tests/test_draft.py and
// test_edit_service.py that exercise sanitize_html.
import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./draft";

describe("sanitizeHtml", () => {
  it("strips <script> tags and inline event handler attributes", () => {
    const dirty =
      '<!DOCTYPE html><html><body><button onclick="alert(1)">x</button>' +
      "<script>alert(1)</script></body></html>";
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("onclick");
  });

  it("strips javascript: URIs", () => {
    const dirty = '<a href="javascript:alert(1)">click</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toMatch(/javascript\s*:/i);
  });

  it("unwraps a single ```html fenced fragment", () => {
    const wrapped = "```html\n<h2>Headline</h2>\n<p>Body</p>\n```";
    expect(sanitizeHtml(wrapped)).toBe("<h2>Headline</h2>\n<p>Body</p>");
  });

  it("strips fences spliced between sections of a full document", () => {
    const doc =
      "<!DOCTYPE html><html><body>" +
      "```html\n<h1>Hero</h1>\n```\n" +
      "```\n<section>Featured pizzas</section>\n```" +
      "</body></html>";
    const clean = sanitizeHtml(doc);
    expect(clean).not.toContain("```");
    expect(clean).toContain("<h1>Hero</h1>");
    expect(clean).toContain("Featured pizzas");
  });

  it("strips a fence opened mid-tag (legacy builder_templates row shape)", () => {
    const doc =
      '<html><body><header data-section="hero" class="c-cafe-2 hero">```html\n' +
      "<div>Start your day</div>\n" +
      "```</header></body></html>";
    const clean = sanitizeHtml(doc);
    expect(clean).not.toContain("```");
    expect(clean).toContain("Start your day");
  });

  it("leaves already-clean HTML untouched", () => {
    const html = "<html><body><h1>Hi</h1></body></html>";
    expect(sanitizeHtml(html)).toBe(html);
  });
});
