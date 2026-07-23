import { describe, expect, it } from "vitest";
import { PACKAGES } from "@/templates/packages";
import { isLaunchTemplateId, resolveTemplateId } from "./site-config";

describe("site-config template routing", () => {
  it("treats ht_cafe_v1 as a launch template (bespoke render path)", () => {
    expect(isLaunchTemplateId("ht_cafe_v1")).toBe(true);
    expect(resolveTemplateId("ht_cafe_v1")).toBe("ht_cafe_v1");
  });
});

describe("all packages route to the bespoke launch path", () => {
  it.each(Object.keys(PACKAGES))("%s is a launch template", (id) => {
    expect(isLaunchTemplateId(id)).toBe(true);
    expect(resolveTemplateId(id)).toBe(id);
  });
});
