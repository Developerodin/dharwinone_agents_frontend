// @vitest-environment node
// Port-fidelity tests for profileFacts (port of
// backend/studio/services/profile_facts.py business_facts).
import { describe, expect, it } from "vitest";
import { businessFacts } from "./profileFacts";

describe("businessFacts", () => {
  it("formats every present field as a bullet, in order", () => {
    const facts = businessFacts({
      business: {
        type: "SaaS",
        description: "HR software",
        services: ["HRMS", "ATS", "Payroll", "Onboarding", "Benefits", "Time tracking", "Extra"],
        targetAudience: "HR teams",
      },
    });
    expect(facts).toBe(
      [
        "- Business type: SaaS",
        "- Description: HR software",
        "- Services: HRMS, ATS, Payroll, Onboarding, Benefits, Time tracking",
        "- Target audience: HR teams",
      ].join("\n"),
    );
  });

  it("omits missing fields and caps services at 6", () => {
    const facts = businessFacts({ business: { type: "Cafe", services: ["Coffee", "Pastries"] } });
    expect(facts).toBe(["- Business type: Cafe", "- Services: Coffee, Pastries"].join("\n"));
  });

  it("returns an empty string for an empty/missing business object", () => {
    expect(businessFacts({})).toBe("");
    expect(businessFacts(null)).toBe("");
    expect(businessFacts(undefined)).toBe("");
  });
});
