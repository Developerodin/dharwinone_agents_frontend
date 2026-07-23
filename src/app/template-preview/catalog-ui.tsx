import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type Registry = {
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
};

const STATUS_STYLE: Record<string, CSSProperties> = {
  convert: { background: "#e8f0fe", color: "#1a4480", border: "1px solid #b8d0f0" },
  new: { background: "#e6f4ea", color: "#137333", border: "1px solid #a8dab5" },
  example: { background: "#f3e8fd", color: "#5b2d82", border: "1px solid #d4b8f0" },
  fallback: { background: "#f1f3f4", color: "#3c4043", border: "1px solid #dadce0" },
  source: { background: "#e6f4ea", color: "#137333", border: "1px solid #a8dab5" },
  variant: { background: "#fef7e0", color: "#7a5c00", border: "1px solid #f0d890" },
  feedstock: { background: "#fce8e6", color: "#c5221f", border: "1px solid #f5c6c2" },
};

function Badge({ label, style }: { label: string; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "0.2rem 0.55rem",
        borderRadius: "4px",
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {label}
    </span>
  );
}

export function TemplateBadges({ reg }: { reg: Registry }) {
  const statusStyle = STATUS_STYLE[reg.status ?? ""] ?? STATUS_STYLE.fallback;
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
      {reg.segmentLabel && (
        <Badge label={reg.segmentLabel} style={{ background: "#fff", color: "#202124", border: "1px solid #dadce0" }} />
      )}
      {reg.subcategoryLabel && (
        <Badge label={reg.subcategoryLabel} style={{ background: "#fafafa", color: "#444", border: "1px solid #e0e0e0" }} />
      )}
      {reg.familyLabel && (
        <Badge label={reg.familyLabel} style={{ background: "#fef7e0", color: "#7a5c00", border: "1px solid #f0d890" }} />
      )}
      {reg.wave != null && <Badge label={`Wave ${reg.wave}`} style={{ background: "#e8eaed", color: "#3c4043", border: "1px solid #dadce0" }} />}
      {reg.status && <Badge label={reg.status} style={statusStyle} />}
    </span>
  );
}

export function TemplateMetaBar({ reg, backHref = "/template-preview" }: { reg: Registry; backHref?: string }) {
  return (
    <div
      role="region"
      aria-label="Template metadata"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#fff",
        borderBottom: "1px solid #dadce0",
        padding: "0.75rem 1.25rem",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.875rem",
      }}
    >
      <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <Link href={backHref} style={{ color: "#1a73e8", textDecoration: "none", fontWeight: 600, marginRight: "0.5rem" }}>
          ← Catalog
        </Link>
        <strong style={{ fontSize: "1rem", color: "#202124" }}>{reg.displayName ?? reg.id}</strong>
        <code style={{ fontSize: "0.75rem", color: "#5f6368", background: "#f1f3f4", padding: "0.15rem 0.4rem", borderRadius: "3px" }}>
          {reg.id}
        </code>
        <TemplateBadges reg={reg} />
        {reg.source && (
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#5f6368" }}>
            Source: {reg.source}
          </span>
        )}
      </div>
    </div>
  );
}

export function CatalogShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.25rem", fontFamily: "system-ui, sans-serif", color: "#202124" }}>
      <header style={{ marginBottom: "2rem", borderBottom: "1px solid #dadce0", paddingBottom: "1.25rem" }}>
        <p style={{ margin: "0 0 0.35rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5f6368" }}>
          Dharwin Studio
        </p>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "#5f6368", lineHeight: 1.5 }}>{subtitle}</p>
        )}
      </header>
      {children}
    </main>
  );
}

const CARD_STYLE: CSSProperties = {
  border: "1px solid #dadce0",
  borderRadius: "6px",
  padding: "0.85rem 1rem",
  background: "#fff",
};

function CatalogEntryCard({ entry }: { entry: import("./catalog-taxonomy").CatalogEntry }) {
  const { reg } = entry;
  const label = reg.displayName ?? (entry.kind === "react" ? entry.id : entry.slug);
  const code = entry.kind === "react" ? entry.id : entry.slug;

  return (
    <li style={CARD_STYLE}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "baseline", marginBottom: "0.45rem" }}>
        {entry.kind === "react" ? (
          <Link href={entry.href} style={{ fontWeight: 700, color: "#1a73e8", textDecoration: "none", fontSize: "1rem" }}>
            {label}
          </Link>
        ) : (
          <a href={entry.href} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "#1a73e8", textDecoration: "none", fontSize: "1rem" }}>
            {label}
          </a>
        )}
        <code style={{ fontSize: "0.72rem", color: "#5f6368" }}>{code}</code>
        <Badge
          label={entry.kind === "react" ? "React" : "HTML"}
          style={{
            background: entry.kind === "react" ? "#e8f0fe" : "#fce8e6",
            color: entry.kind === "react" ? "#1a4480" : "#c5221f",
            border: entry.kind === "react" ? "1px solid #b8d0f0" : "1px solid #f5c6c2",
          }}
        />
        {reg.linked_template_id && (
          <code style={{ fontSize: "0.72rem", color: "#5f6368" }}>→ {reg.linked_template_id}</code>
        )}
      </div>
      <TemplateBadges reg={reg} />
    </li>
  );
}

export function CatalogTaxonomyTree({ tree }: { tree: import("./catalog-taxonomy").SegmentGroup[] }) {
  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      {tree.map((segment) => (
        <section key={segment.segment} aria-labelledby={`seg-${segment.segment}`}>
          <div
            id={`seg-${segment.segment}`}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "center",
              marginBottom: "1rem",
              paddingBottom: "0.5rem",
              borderBottom: "2px solid #202124",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>{segment.segmentLabel}</h2>
            {segment.wave != null && <Badge label={`Wave ${segment.wave}`} style={{ background: "#e8eaed", color: "#3c4043", border: "1px solid #dadce0" }} />}
            <span style={{ fontSize: "0.75rem", color: "#5f6368" }}>
              {segment.subcategories.length} sub-categor{segment.subcategories.length === 1 ? "y" : "ies"}
            </span>
          </div>

          <div style={{ display: "grid", gap: "1.5rem", paddingLeft: "0.25rem" }}>
            {segment.subcategories.map((subcat) => (
              <div key={`${segment.segment}-${subcat.subcategory}`}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#3c4043" }}>{subcat.subcategoryLabel}</h3>
                  {subcat.wave != null && subcat.wave !== segment.wave && (
                    <Badge label={`Wave ${subcat.wave}`} style={{ background: "#e8eaed", color: "#3c4043", border: "1px solid #dadce0" }} />
                  )}
                </div>

                <div style={{ display: "grid", gap: "1rem", paddingLeft: "0.75rem", borderLeft: "2px solid #e8eaed" }}>
                  {subcat.families.map((family) => (
                    <div key={`${segment.segment}-${subcat.subcategory}-${family.family}`}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center", marginBottom: "0.5rem" }}>
                        <h4 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#7a5c00" }}>
                          {family.familyLabel}
                        </h4>
                        <Badge label={family.familyLabel} style={{ background: "#fef7e0", color: "#7a5c00", border: "1px solid #f0d890" }} />
                        <span style={{ fontSize: "0.72rem", color: "#5f6368" }}>
                          {family.entries.length} template{family.entries.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.65rem" }}>
                        {family.entries.map((entry) => (
                          <CatalogEntryCard key={`${entry.kind}-${entry.kind === "react" ? entry.id : entry.slug}`} entry={entry} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
