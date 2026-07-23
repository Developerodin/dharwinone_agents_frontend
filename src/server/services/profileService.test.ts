// @vitest-environment node
// Port of backend/studio/tests/test_profile_service.py — completeness math,
// generation gate, and profile persistence.
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import * as profilesRepo from "../repos/profilesRepo";
import * as projectsRepo from "../repos/projectsRepo";
import * as profileService from "./profileService";

beforeEach(async () => {
  await freshTestDb();
});

function completeProfile(projectId: string): Record<string, unknown> {
  return {
    projectId,
    brand: { brandName: "Dharwin One", businessName: null, tagline: null },
    business: {
      type: "SaaS",
      services: ["HRMS", "ATS"],
      description: "HR software",
      targetAudience: "HR teams",
    },
    location: { country: "India", state: null, city: "Jaipur", address: null },
    contact: {
      email: "hello@dharwin.com",
      phone: "+1 555 0100",
      website: null,
      socialLinks: [],
    },
    completeness: { percent: 100, missingFields: [] },
    updatedAt: 0,
  };
}

describe("evaluateGenerationGate", () => {
  it("blocks an incomplete profile", () => {
    const profile = completeProfile("p1");
    (profile.brand as Record<string, unknown>).brandName = null;
    const gate = profileService.evaluateGenerationGate(profile);
    expect(gate.ready).toBe(false);
    expect(gate.missingFields).toContain("brand name");
  });

  it("passes a complete profile", () => {
    const profile = completeProfile("p1");
    const gate = profileService.evaluateGenerationGate(profile);
    expect(gate.ready).toBe(true);
    expect(gate.missingFields).toEqual([]);
    expect(gate.percent).toBe(100);
  });

  it("requires at least one service", () => {
    const profile = completeProfile("p1");
    (profile.business as Record<string, unknown>).services = [];
    const gate = profileService.evaluateGenerationGate(profile);
    expect(gate.ready).toBe(false);
    expect(gate.missingFields).toContain("at least one service");
  });

  it("skips the city requirement when country lists multiple places", () => {
    const profile = completeProfile("p1");
    (profile.location as Record<string, unknown>).country = "India and USA";
    (profile.location as Record<string, unknown>).city = null;
    const gate = profileService.evaluateGenerationGate(profile);
    expect(gate.missingFields).not.toContain("city");
  });

  it("honors skipped fields", () => {
    const profile = completeProfile("p1");
    (profile.brand as Record<string, unknown>).brandName = null;
    profile.skipped = ["brand.brandName"];
    const gate = profileService.evaluateGenerationGate(profile);
    expect(gate.missingFields).not.toContain("brand name");
  });
});

describe("isMultiPlaceValue / splitMultiPlaceValue", () => {
  it("detects comma- and 'and'-separated places", () => {
    expect(profileService.isMultiPlaceValue("India and USA")).toBe(true);
    expect(profileService.isMultiPlaceValue("India, USA")).toBe(true);
    expect(profileService.isMultiPlaceValue("India")).toBe(false);
    expect(profileService.isMultiPlaceValue(null)).toBe(false);
  });

  it("splits into trimmed parts", () => {
    expect(profileService.splitMultiPlaceValue("India and USA")).toEqual(["India", "USA"]);
  });
});

describe("updateProfile", () => {
  it("merges patches and recomputes completeness", async () => {
    const project = await projectsRepo.create("Acme", "Build site");
    const updated = await profileService.updateProfile(project.projectId, {
      brand: { brandName: "Acme Corp" },
      contact: { email: "a@acme.com" },
    });
    expect((updated.brand as Record<string, unknown>).brandName).toBe("Acme Corp");
    expect((updated.contact as Record<string, unknown>).email).toBe("a@acme.com");
    expect((updated.completeness as Record<string, unknown>).percent as number).toBeGreaterThan(0);
    expect((updated.completeness as { missingFields: string[] }).missingFields).not.toContain("brand name");
  });

  it("rejects an invalid contact email", async () => {
    const project = await projectsRepo.create("Acme", "Build site");
    await expect(
      profileService.updateProfile(project.projectId, { contact: { email: "not-an-email" } }),
    ).rejects.toBeInstanceOf(profileService.ProfileValidationError);
  });

  it("404s for a missing project", async () => {
    await expect(
      profileService.updateProfile("no-such-project", { brand: { brandName: "X" } }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("getProfile", () => {
  it("returns an empty shell for a new project, gated at 0%", async () => {
    const project = await projectsRepo.create("Fresh", "Hi");
    const profile = await profileService.getProfile(project.projectId);
    expect(profile.projectId).toBe(project.projectId);
    expect((profile.completeness as Record<string, unknown>).percent).toBe(0);
    expect((profile.gate as Record<string, unknown>).ready).toBe(false);
    const saved = await profilesRepo.get(project.projectId);
    expect((saved.brand as Record<string, unknown>).brandName).toBeNull();
  });

  it("404s for a missing project", async () => {
    await expect(profileService.getProfile("no-such-project")).rejects.toMatchObject({ status: 404 });
  });
});
