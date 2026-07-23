/** Shared taxonomy grouping for React packages + HTML feedstock (mirrors backend/studio/catalog). */

export type CatalogRegistry = {
  id: string;
  displayName?: string;
  segment?: string | null;
  segmentLabel?: string;
  subcategory?: string | null;
  subcategoryLabel?: string;
  family?: string;
  familyLabel?: string;
  status?: string;
  wave?: number;
  source?: string;
  linked_template_id?: string;
};

export type CatalogEntry =
  | { kind: "react"; id: string; href: string; reg: CatalogRegistry }
  | { kind: "html"; slug: string; href: string; reg: CatalogRegistry };

export type FamilyGroup = {
  family: string;
  familyLabel: string;
  entries: CatalogEntry[];
};

export type SubcategoryGroup = {
  subcategory: string;
  subcategoryLabel: string;
  wave?: number;
  families: FamilyGroup[];
};

export type SegmentGroup = {
  segment: string;
  segmentLabel: string;
  wave?: number;
  subcategories: SubcategoryGroup[];
};

/** Proposal Wave-1 segments first, then Wave-2 bonus segments, generic last. */
const SEGMENT_ORDER = [
  "real_estate",
  "local_service",
  "retail",
  "hospitality_travel",
  "health_education",
  "professional",
  "_generic",
] as const;

const FAMILY_ORDER = [
  "trust_local",
  "bold_convert",
  "clean_pro",
  "premium_dark",
  "warm_craft",
  "fresh_retail",
  "generic",
] as const;

function segmentKey(reg: CatalogRegistry): string {
  return reg.segment ?? "_generic";
}

function subcategoryKey(reg: CatalogRegistry): string {
  return reg.subcategory ?? "_fallback";
}

function familyKey(reg: CatalogRegistry): string {
  return reg.family ?? "generic";
}

function orderIndex<T extends string>(list: readonly T[], value: string): number {
  const i = list.indexOf(value as T);
  return i === -1 ? list.length : i;
}

function entrySort(a: CatalogEntry, b: CatalogEntry): number {
  if (a.kind !== b.kind) return a.kind === "react" ? -1 : 1;
  const nameA = a.reg.displayName ?? (a.kind === "react" ? a.id : a.slug);
  const nameB = b.reg.displayName ?? (b.kind === "react" ? b.id : b.slug);
  return nameA.localeCompare(nameB);
}

export function buildCatalogTree(entries: CatalogEntry[]): SegmentGroup[] {
  const segments = new Map<string, SegmentGroup>();

  for (const entry of entries) {
    const { reg } = entry;
    const seg = segmentKey(reg);
    const sub = subcategoryKey(reg);
    const fam = familyKey(reg);

    if (!segments.has(seg)) {
      segments.set(seg, {
        segment: seg,
        segmentLabel: reg.segmentLabel ?? (seg === "_generic" ? "Generic" : seg),
        wave: reg.wave,
        subcategories: [],
      });
    }
    const segment = segments.get(seg)!;
    if (reg.wave != null && (segment.wave == null || reg.wave < segment.wave)) {
      segment.wave = reg.wave;
    }

    let subcat = segment.subcategories.find((s) => s.subcategory === sub);
    if (!subcat) {
      subcat = {
        subcategory: sub,
        subcategoryLabel: reg.subcategoryLabel ?? (sub === "_fallback" ? "Fallback" : sub),
        wave: reg.wave,
        families: [],
      };
      segment.subcategories.push(subcat);
    }
    if (reg.wave != null && (subcat.wave == null || reg.wave < subcat.wave)) {
      subcat.wave = reg.wave;
    }

    let family = subcat.families.find((f) => f.family === fam);
    if (!family) {
      family = {
        family: fam,
        familyLabel: reg.familyLabel ?? fam,
        entries: [],
      };
      subcat.families.push(family);
    }
    family.entries.push(entry);
  }

  for (const segment of segments.values()) {
    for (const subcat of segment.subcategories) {
      for (const family of subcat.families) {
        family.entries.sort(entrySort);
      }
      subcat.families.sort(
        (a, b) => orderIndex(FAMILY_ORDER, a.family) - orderIndex(FAMILY_ORDER, b.family),
      );
    }
    segment.subcategories.sort((a, b) => a.subcategoryLabel.localeCompare(b.subcategoryLabel));
  }

  return [...segments.values()].sort(
    (a, b) => orderIndex(SEGMENT_ORDER, a.segment) - orderIndex(SEGMENT_ORDER, b.segment),
  );
}

export function countEntries(tree: SegmentGroup[]): { react: number; html: number; total: number } {
  let react = 0;
  let html = 0;
  for (const seg of tree) {
    for (const sub of seg.subcategories) {
      for (const fam of sub.families) {
        for (const e of fam.entries) {
          if (e.kind === "react") react += 1;
          else html += 1;
        }
      }
    }
  }
  return { react, html, total: react + html };
}
