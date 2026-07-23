import { describe, expect, it } from "vitest";
import { isLaunchTemplateId, resolveTemplateId } from "./site-config";

describe("site-config template routing", () => {
  it("treats ht_cafe_v1 as a launch template (bespoke render path)", () => {
    expect(isLaunchTemplateId("ht_cafe_v1")).toBe(true);
    expect(resolveTemplateId("ht_cafe_v1")).toBe("ht_cafe_v1");
  });
});
