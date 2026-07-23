// Port of backend/studio/repositories/profiles_repo.py — same function
// surface, same returned shapes (camelCase, no `id`).
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { toDoc } from "./doc";

export type ProfileDoc = Record<string, unknown> & {
  projectId: string;
  brand: Record<string, unknown>;
  business: Record<string, unknown>;
  location: Record<string, unknown>;
  contact: Record<string, unknown>;
  design: Record<string, unknown>;
  skipped: unknown[];
  completeness: Record<string, unknown>;
  updatedAt: number;
};

// Keys that default to a nested shape when the stored column is null — same
// list the Python fills in from `_empty_profile`.
const JSON_DEFAULT_KEYS = [
  "brand",
  "business",
  "location",
  "contact",
  "design",
  "skipped",
  "completeness",
] as const;

// Mirrors `{c.name for c in BusinessProfile.__table__.columns}` in the Python —
// the real businessProfiles table columns, minus the surrogate `id`.
const PROFILE_COLUMNS = new Set([
  "projectId",
  "brand",
  "business",
  "location",
  "contact",
  "design",
  "skipped",
  "completeness",
  "updatedAt",
]);

function emptyProfile(projectId: string): ProfileDoc {
  return {
    projectId,
    brand: { brandName: null, businessName: null, tagline: null },
    business: {
      type: null,
      services: [],
      description: null,
      targetAudience: null,
    },
    location: {
      country: null,
      state: null,
      city: null,
      address: null,
    },
    contact: {
      email: null,
      phone: null,
      website: null,
      socialLinks: [],
    },
    design: { stylePreference: null },
    skipped: [],
    completeness: { percent: 0, missingFields: [] },
    updatedAt: Date.now() / 1000,
  };
}

export async function get(projectId: string): Promise<ProfileDoc> {
  const row = await prisma().businessProfiles.findFirst({ where: { projectId } });
  if (!row) return emptyProfile(projectId);
  const doc = toDoc(row) as ProfileDoc;
  const defaults = emptyProfile(projectId);
  for (const key of JSON_DEFAULT_KEYS) {
    if (doc[key] === null || doc[key] === undefined) {
      (doc as Record<string, unknown>)[key] = defaults[key];
    }
  }
  return doc;
}

export async function save(profile: Record<string, unknown> & { projectId: string }): Promise<ProfileDoc> {
  const next: Record<string, unknown> = { ...profile, updatedAt: Date.now() / 1000 };
  const projectId = next.projectId as string;
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(next)) {
    if (key !== "id" && PROFILE_COLUMNS.has(key)) fields[key] = value;
  }
  const existing = await prisma().businessProfiles.findFirst({ where: { projectId } });
  if (existing) {
    await prisma().businessProfiles.update({
      where: { projectId },
      data: fields as Prisma.businessProfilesUncheckedUpdateInput,
    });
  } else {
    await prisma().businessProfiles.create({
      data: fields as Prisma.businessProfilesUncheckedCreateInput,
    });
  }
  return get(projectId);
}
