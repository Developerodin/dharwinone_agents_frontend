import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PACKAGES } from "@/templates/packages";
import { CatalogShell, CatalogTaxonomyTree } from "./catalog-ui";
import { buildCatalogTree, countEntries, type CatalogEntry } from "./catalog-taxonomy";

export const metadata: Metadata = { title: "Template Catalog Preview" };

const BACKEND_CATALOG = path.resolve(process.cwd(), "..", "..", "backend", "studio", "catalog");

type HtmlRegistryEntry = {
  slug: string;
  displayName?: string;
  segment?: string | null;
  segmentLabel?: string;
  subcategory?: string | null;
  subcategoryLabel?: string;
  family?: string;
  familyLabel?: string;
  status?: string;
  wave?: number;
  linked_template_id?: string;
};

export default async function TemplateCatalogPage() {
  const reactEntries: CatalogEntry[] = (Object.keys(PACKAGES) as (keyof typeof PACKAGES)[]).map((id) => ({
    kind: "react" as const,
    id,
    href: `/template-preview/${id}`,
    reg: { ...PACKAGES[id].registry, id },
  }));

  let htmlEntries: CatalogEntry[] = [];
  try {
    const raw = await readFile(path.join(BACKEND_CATALOG, "html_templates.json"), "utf-8");
    const htmlTemplates = (JSON.parse(raw) as { templates: HtmlRegistryEntry[] }).templates;
    htmlEntries = htmlTemplates.map((reg) => ({
      kind: "html" as const,
      slug: reg.slug,
      href: `/template-preview/html/${reg.slug}`,
      reg: { ...reg, id: reg.slug },
    }));
  } catch {
    // catalog not generated yet — React packages still render
  }

  const tree = buildCatalogTree([...reactEntries, ...htmlEntries]);
  const counts = countEntries(tree);

  return (
    <CatalogShell
      title="Template Catalog"
      subtitle={`${counts.react} React packages · ${counts.html} HTML templates · grouped by category → subcategory → design family`}
    >
      <CatalogTaxonomyTree tree={tree} />
    </CatalogShell>
  );
}
