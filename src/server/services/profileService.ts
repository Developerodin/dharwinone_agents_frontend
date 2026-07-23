// Port of backend/studio/services/profile_service.py — business profile
// persistence, validation, and generation gate. Field weights/logic are
// exact 1:1 with the Python (same _REQUIRED_FIELDS list, same completeness
// math, same is_multi_place_value rule).
import { HttpError } from "../policy";
import * as profilesRepo from "../repos/profilesRepo";
import * as projectsRepo from "../repos/projectsRepo";

type Profile = Record<string, unknown>;

const REQUIRED_FIELDS: Array<[string, string]> = [
  ["brand.brandName", "brand name"],
  ["business.type", "business type"],
  ["business.services", "at least one service"],
  ["business.description", "homepage intro line"],
  ["business.targetAudience", "target audience"],
  ["location.country", "country"],
  ["location.city", "city"],
];

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;
const MERGE_KEYS = new Set(["brand", "business", "location", "contact", "design", "skipped"]);
const MULTI_PLACE_RE = /,|\band\b/i;

export class ProfileValidationError extends Error {}

export class ProfileIncompleteError extends Error {
  missingFields: string[];
  constructor(missingFields: string[]) {
    super("profile incomplete");
    this.missingFields = [...missingFields];
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Python truthiness: None, "", 0, False, and empty containers are all falsy.
function pyFalsy(v: unknown): boolean {
  if (v === null || v === undefined || v === "" || v === 0 || v === false) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (isPlainObject(v)) return Object.keys(v).length === 0;
  return false;
}

export function isMultiPlaceValue(value: unknown): boolean {
  if (!value || typeof value !== "string") return false;
  const parts = value.split(MULTI_PLACE_RE).map((p) => p.trim()).filter(Boolean);
  return parts.length >= 2;
}

export function splitMultiPlaceValue(value: unknown): string[] {
  if (!value || typeof value !== "string") return [];
  return value.split(MULTI_PLACE_RE).map((p) => p.trim()).filter(Boolean);
}

function getNested(profile: Profile, path: string): unknown {
  let cur: unknown = profile;
  for (const part of path.split(".")) {
    cur = isPlainObject(cur) ? cur[part] : null;
    if (cur === null || cur === undefined) return null;
  }
  return cur;
}

function missingFields(profile: Profile): string[] {
  const skipped = new Set(((profile.skipped as unknown[]) ?? []) as unknown[]);
  const missing: string[] = [];
  for (const [path, label] of REQUIRED_FIELDS) {
    if (skipped.has(path)) continue;
    const val = getNested(profile, path);
    if (path === "location.city") {
      const country = getNested(profile, "location.country");
      if (isMultiPlaceValue(country)) continue;
      if (pyFalsy(val)) missing.push(label);
    } else if (pyFalsy(val)) {
      missing.push(label);
    }
  }
  return missing;
}

export function computeCompleteness(profile: Profile): { percent: number; missingFields: string[] } {
  const total = REQUIRED_FIELDS.length;
  const missing = missingFields(profile);
  const done = total - missing.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const completeness = { percent, missingFields: missing };
  profile.completeness = completeness;
  return completeness;
}

export function evaluateGenerationGate(
  profile: Profile,
): { ready: boolean; percent: number; missingFields: string[] } {
  const completeness = computeCompleteness(profile);
  return {
    ready: completeness.missingFields.length === 0,
    percent: completeness.percent,
    missingFields: completeness.missingFields,
  };
}

function deepMerge(base: Profile, patch: Record<string, unknown>): Profile {
  for (const [key, value] of Object.entries(patch)) {
    if (!MERGE_KEYS.has(key)) continue;
    if (isPlainObject(value) && isPlainObject(base[key])) {
      base[key] = { ...(base[key] as Record<string, unknown>), ...value };
    } else {
      base[key] = value;
    }
  }
  return base;
}

function validateProfile(profile: Profile): void {
  const email = getNested(profile, "contact.email");
  if (email && !EMAIL_RE.test(String(email))) {
    throw new ProfileValidationError("invalid contact email");
  }
  const phone = getNested(profile, "contact.phone");
  if (phone && !PHONE_RE.test(String(phone))) {
    throw new ProfileValidationError("invalid contact phone");
  }
  const services = getNested(profile, "business.services");
  if (services !== null && services !== undefined && !Array.isArray(services)) {
    throw new ProfileValidationError("business.services must be a list");
  }
}

export async function getProfile(projectId: string): Promise<Profile> {
  if (!(await projectsRepo.get(projectId))) {
    throw new HttpError(404, "project not found");
  }
  const profile = await profilesRepo.get(projectId);
  const gate = evaluateGenerationGate(profile);
  (profile as Profile).gate = gate;
  return profile;
}

export async function updateProfile(
  projectId: string,
  patch: Record<string, unknown> | null,
): Promise<Profile> {
  if (!(await projectsRepo.get(projectId))) {
    throw new HttpError(404, "project not found");
  }
  const profile: Profile = await profilesRepo.get(projectId);
  deepMerge(profile, patch ?? {});
  validateProfile(profile);
  computeCompleteness(profile);
  await profilesRepo.save(profile as profilesRepo.ProfileDoc);
  const gate = evaluateGenerationGate(profile);
  profile.gate = gate;
  return profile;
}

export async function requireGenerationReady(projectId: string): Promise<Profile> {
  const profile = await profilesRepo.get(projectId);
  const gate = evaluateGenerationGate(profile);
  if (!gate.ready) {
    throw new ProfileIncompleteError(gate.missingFields);
  }
  return profile;
}
