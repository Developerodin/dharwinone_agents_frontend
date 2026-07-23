// Port of backend/studio/draft.py.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { backendDir } from "./config";
import type { Provider } from "./providers";

// Mirrors _FENCE_BLOCK_RE = re.compile(r"```(?:html|htm|xml|json)?\s*\r?\n(.*?)\r?\n```", re.I | re.S)
// (re.S / DOTALL is expressed as [\s\S] instead of the `s` flag — tsconfig
// targets ES2017, which predates the dotAll flag.)
const FENCE_BLOCK_RE = /```(?:html|htm|xml|json)?\s*\r?\n([\s\S]*?)\r?\n```/gi;
// Mirrors _FENCE_OPEN_RE = re.compile(r"^```(?:html|htm|xml|json)?\s*\r?\n?", re.I)
const FENCE_OPEN_RE = /^```(?:html|htm|xml|json)?\s*\r?\n?/i;
// Mirrors _FENCE_CLOSE_RE = re.compile(r"\r?\n?```\s*$")
const FENCE_CLOSE_RE = /\r?\n?```\s*$/;
// Mirrors _STANDALONE_FENCE_LINE_RE = re.compile(r"^\s*```(?:html|htm|xml|json)?\s*\r?$", re.I | re.M)
const STANDALONE_FENCE_LINE_RE = /^\s*```(?:html|htm|xml|json)?\s*\r?$/gim;

// Mirrors re.sub(r"(?is)<script\b[^>]*>.*?(</script\s*>|$)", "", html)
const SCRIPT_TAG_RE = /<script\b[^>]*>[\s\S]*?(<\/script\s*>|$)/gi;
// Mirrors re.sub(r"(?i)\son\w+\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)", "", html)
const EVENT_ATTR_RE = /\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
// Mirrors re.sub(r"(?i)javascript\s*:", "", html)
const JAVASCRIPT_URI_RE = /javascript\s*:/gi;

/** Port of studio.draft._strip_markdown_fences: remove ```html / ``` wrappers
 * and orphan fence lines from LLM output. */
function stripMarkdownFences(text: string): string {
  let out = text.trim();

  let prev: string | null = null;
  while (prev !== out) {
    prev = out;
    out = out.replace(FENCE_BLOCK_RE, "$1");
  }

  let changed = true;
  while (changed) {
    changed = false;
    let peeled = out.replace(FENCE_OPEN_RE, "");
    if (peeled !== out) {
      out = peeled;
      changed = true;
    }
    peeled = out.replace(FENCE_CLOSE_RE, "");
    if (peeled !== out) {
      out = peeled;
      changed = true;
    }
  }

  out = out.replace(STANDALONE_FENCE_LINE_RE, "");
  while (/\n[ \t]*\n/.test(out)) {
    out = out.replace(/\n[ \t]*\n/, "\n");
  }
  return out.trim();
}

/** Port of studio.draft.sanitize_html: remove executable payloads from
 * model/user supplied HTML — strips markdown code fences, <script> tags,
 * inline "on*=" event handler attributes, and "javascript:" URIs. */
export function sanitizeHtml(html: string): string {
  let out = stripMarkdownFences(html);
  out = out.replace(SCRIPT_TAG_RE, "");
  out = out.replace(EVENT_ATTR_RE, "");
  return out.replace(JAVASCRIPT_URI_RE, "");
}

// ---------------------------------------------------------------------------
// Template picking + genre keyword tables
// ---------------------------------------------------------------------------

/** Directory containing the 33 genre HTML templates. Configurable via
 * STUDIO_BACKEND_DIR (default: "../../backend" relative to process.cwd(),
 * same default backendDir() in config.ts uses) — the template files
 * themselves stay in the Python backend until cutover. */
export function templatesDir(): string {
  return path.join(backendDir(), "studio", "templates");
}

export const TEMPLATE_TAGS: Record<string, string[]> = {
  cafe: [
    "coffee",
    "cafe",
    "restaurant",
    "bakery",
    "bar",
    "food",
    "pizza",
    "tea",
    "diner",
    "bistro",
    "kitchen",
  ],
  shop: [
    "shop",
    "store",
    "shoes",
    "shoe",
    "sports",
    "ecommerce",
    "e-commerce",
    "product",
    "fashion",
    "clothing",
    "sneaker",
    "sell",
    "boutique",
    "jewelry",
    "watch",
  ],
  portfolio: [
    "portfolio",
    "photographer",
    "photography",
    "designer",
    "artist",
    "personal",
    "resume",
    "cv",
    "freelance",
  ],
  saas: [
    "saas",
    "app",
    "software",
    "startup",
    "tech",
    "ai",
    "platform",
    "tool",
    "api",
    "dashboard",
    "cloud",
  ],
  fitness: [
    "gym",
    "fitness",
    "yoga",
    "sport",
    "sports",
    "workout",
    "training",
    "crossfit",
    "athletic",
    "run",
    "club",
  ],
  agency: [
    "agency",
    "consulting",
    "consultancy",
    "marketing",
    "law",
    "legal",
    "finance",
    "studio",
    "services",
    "firm",
  ],
  construction: [
    "construction",
    "builder",
    "builders",
    "building",
    "contractor",
    "renovation",
    "interior",
    "interiors",
    "architecture",
    "architect",
    "civil",
    "infrastructure",
    "real estate",
    "property",
    "developer",
  ],
  medical: [
    "clinic",
    "doctor",
    "dental",
    "dentist",
    "hospital",
    "health",
    "healthcare",
    "medical",
    "pharmacy",
    "physio",
    "therapy",
    "diagnostic",
  ],
  education: [
    "school",
    "college",
    "academy",
    "course",
    "courses",
    "coaching",
    "tuition",
    "education",
    "learning",
    "institute",
    "university",
    "tutoring",
  ],
  travel: [
    "travel",
    "tour",
    "tours",
    "tourism",
    "hotel",
    "resort",
    "trip",
    "vacation",
    "holiday",
    "adventure",
    "safari",
  ],
};

export const DEFAULT_TAGLINES: Record<string, string> = {
  cafe: "Small-batch roasts, fresh mornings, and a room worth staying in.",
  shop: "New drops, fair prices, free returns.",
  portfolio: "Selected work and commissions.",
  saas: "Less busywork. More momentum.",
  fitness: "Programs that meet you where you are.",
  agency: "Senior work, measured outcomes.",
  construction: "On time, on spec, on budget.",
  medical: "Care that starts with listening.",
  education: "Learn from people who teach for a living.",
  travel: "Trips planned by people who have been there.",
  generic: "What we do, and why it works.",
};

const STOPWORDS = new Set(
  (
    "build create make design want need a an the for me my our new simple " +
    "one page single website site web landing homepage home online modern " +
    "beautiful nice cool please and with of to that can you company business " +
    "called named which who operates operating based located in at"
  ).split(" "),
);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
}

/** Port of studio.draft.pick_template. */
export function pickTemplate(prompt: string): string {
  const words = prompt.toLowerCase().match(/[a-z]+/g) ?? [];
  const text = words.join(" ");
  let best = "generic";
  let bestScore = 0;
  let bestTie = 0;
  for (const [name, tags] of Object.entries(TEMPLATE_TAGS)) {
    const wordRe = (t: string) => new RegExp(`\\b${escapeRegExp(t)}\\b`);
    const matched = tags.filter((t) => wordRe(t).test(text));
    const score = matched.length;
    const tie = matched.reduce((sum, t) => sum + t.length, 0);
    if (score > bestScore || (score === bestScore && tie > bestTie)) {
      best = name;
      bestScore = score;
      bestTie = tie;
    }
  }
  return best;
}

const CLAUSE_BREAK = new Set(
  "which that who in for and with operates operating based located".split(" "),
);

function capitalize(w: string): string {
  return w.length === 0 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase();
}

/** Port of studio.draft.brand_from_prompt. */
export function brandFromPrompt(prompt: string): string {
  // "called Delta" / "named Delta Corp" names the brand explicitly
  const m = /\b(?:called|named)\s+(.{1,40})/i.exec(prompt);
  if (m) {
    const words: string[] = [];
    const found = m[1].match(/[A-Za-z0-9&]+/g) ?? [];
    for (const w of found) {
      if (CLAUSE_BREAK.has(w.toLowerCase()) || words.length === 2) break;
      words.push(w);
    }
    if (words.length > 0) {
      return words.map(capitalize).join(" ");
    }
  }
  const words = (prompt.match(/[A-Za-z]+/g) ?? []).filter((w) => !STOPWORDS.has(w.toLowerCase()));
  if (words.length === 0) return "Your Brand";
  return words.slice(0, 3).map(capitalize).join(" ");
}

const LEAD_WORDS = new Set(
  (
    "build create make design i want need a an the me my please website " +
    "site web page landing homepage for one new simple modern"
  ).split(" "),
);

function stripChars(s: string, chars: string): string {
  let start = 0;
  let end = s.length;
  while (start < end && chars.includes(s[start])) start++;
  while (end > start && chars.includes(s[end - 1])) end--;
  return s.slice(start, end);
}

function pySplit(s: string): string[] {
  const t = s.trim();
  return t === "" ? [] : t.split(/\s+/);
}

function pyTitle(s: string): string {
  return s.replace(/[A-Za-z]+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

/** Port of studio.draft.tagline_from_prompt: subject-grounded tagline; never
 * echo the raw command prompt. */
export function taglineFromPrompt(prompt: string, template: string): string {
  let text = prompt.replace(/\b(?:called|named)\s+[A-Za-z0-9&]+\s*/gi, "");
  text = text.replace(/\b(?:which|that)\s+operates\b/gi, "operating");
  const words = pySplit(text);
  while (words.length > 0 && LEAD_WORDS.has(stripChars(words[0].toLowerCase(), ",."))) {
    words.shift();
  }
  let rest = stripChars(words.join(" "), " .,");
  if (pySplit(rest).length < 3) {
    return DEFAULT_TAGLINES[template] ?? DEFAULT_TAGLINES.generic;
  }
  // place names read wrong lowercased: "in delhi and noida" -> title-case tail
  rest = rest.replace(/(?<=\bin )([a-z].*)$/, (m) => pyTitle(m).replace(/ And /g, " and "));
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

// ---------------------------------------------------------------------------
// Style packs
// ---------------------------------------------------------------------------

export interface StylePack {
  id: string;
  label: string;
  css?: string;
  accent?: string;
  ink?: string;
  muted?: string;
  bg?: string;
  surface?: string;
  font?: string;
}

// Style packs restyle any template by overriding every known theme
// variable at once. ponytail: superset of var names beats per-template
// theming contracts; imperfect corners are fine for a draft.
export const STYLE_PACKS: StylePack[] = [
  { id: "original", label: "Original", css: "" },
  {
    id: "sleek-dark",
    label: "Sleek Dark",
    accent: "#4f7cff",
    ink: "#e8eaf2",
    muted: "#9aa1b5",
    bg: "#0e1016",
    surface: "#161a24",
    font: "'Inter',sans-serif",
  },
  {
    id: "minimal-light",
    label: "Minimal Light",
    accent: "#111111",
    ink: "#1a1a1a",
    muted: "#6f6f6f",
    bg: "#ffffff",
    surface: "#f5f4f1",
    font: "'Inter',sans-serif",
  },
  {
    id: "bold-pop",
    label: "Bold Pop",
    accent: "#ff3d67",
    ink: "#14121f",
    muted: "#5c5872",
    bg: "#fff7e8",
    surface: "#ffffff",
    font: "'Space Grotesk',sans-serif",
  },
  {
    id: "frosted",
    label: "Frosted Glass",
    accent: "#5a8fe6",
    ink: "#1c2434",
    muted: "#68738a",
    bg: "#eef2f8",
    surface: "#ffffff",
    font: "'Inter',sans-serif",
  },
  {
    id: "luxe-serif",
    label: "Luxe Serif",
    accent: "#1f3d2b",
    ink: "#20241f",
    muted: "#6b7265",
    bg: "#f7f4ec",
    surface: "#ffffff",
    font: "'Playfair Display',Georgia,serif",
  },
  {
    id: "high-contrast",
    label: "High Contrast",
    accent: "#ffd400",
    ink: "#000000",
    muted: "#444444",
    bg: "#ffffff",
    surface: "#f2f2f2",
    font: "'Archivo',sans-serif",
  },
  {
    id: "ocean-calm",
    label: "Ocean Calm",
    accent: "#0e7c86",
    ink: "#12303a",
    muted: "#5e7c85",
    bg: "#f2fbfa",
    surface: "#ffffff",
    font: "'Sora',sans-serif",
  },
];

function packCss(pack: StylePack): string {
  return `
<style id="style-pack" data-pack="${pack.id}">
:root {
  --accent:${pack.accent}; --pop:${pack.accent}; --volt:${pack.accent}; --gold:${pack.accent};
  --brand:${pack.accent};
  --ink:${pack.ink}; --dim:${pack.muted};
  --bg:${pack.bg}; --cream:${pack.bg}; --paper:${pack.bg}; --soft:${pack.surface}; --line:${pack.surface};
}
body { background:${pack.bg} !important; color:${pack.ink} !important; }
h1,h2,h3 { font-family:${pack.font} !important; }
.bg-white,.card-soft,.menu-card,.product,.feature,.service,.plan {
  background:${pack.surface} !important; color:${pack.ink} !important;
}
.text-muted,.text-secondary,.text-white-50 { color:${pack.muted} !important; }
.btn-primary,.btn-accent,.btn-pop,.btn-volt,.btn-brand,.btn-ink {
  background:${pack.accent} !important; border-color:${pack.accent} !important;
  color:${pack.bg} !important;
}
footer { background:${pack.surface} !important; color:${pack.muted} !important; }
</style>
`;
}

const LABEL_RE = /name="design-label"\s+content="([^"]+)"/;

export function templateFiles(name: string): string[] {
  const rx = new RegExp(`^${escapeRegExp(name)}(-\\d+)?\\.html$`);
  const files = readdirSync(templatesDir()).filter((f) => rx.test(f));
  return [...files].sort((a, b) => {
    const ak = a !== `${name}.html`; // false ("is the base design") sorts first
    const bk = b !== `${name}.html`;
    if (ak !== bk) return ak ? 1 : -1;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

function designLabel(raw: string, stem: string, base: string): string {
  const m = LABEL_RE.exec(raw);
  if (m) return m[1];
  return stem === base ? "Classic" : pyTitle(stem.replaceAll("-", " "));
}

function fillTemplate(html: string, prompt: string, template: string): string {
  // prompt is user input headed into served HTML — escape it (XSS)
  const brand = htmlEscape(brandFromPrompt(prompt));
  const tagline = htmlEscape(taglineFromPrompt(prompt, template));
  return html.replaceAll("{{BRAND}}", brand).replaceAll("{{TAGLINE}}", tagline);
}

/** Port of Python's html.escape(s, quote=True). */
function htmlEscape(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
}

const PACK_BLOCK_RE = /<style id="style-pack"[\s\S]*?<\/style>\s*/gi;
const PACK_ID_RE = /<style id="style-pack"[^>]*data-pack="([^"]+)"/i;

// Words that name a specific pack. Anything else rotates to the next pack.
const PACK_KEYWORDS: Array<[string, string[]]> = [
  ["sleek-dark", ["dark", "night", "black", "moody"]],
  ["minimal-light", ["minimal", "light", "clean", "simple", "plain", "white"]],
  ["bold-pop", ["bold", "pop", "vibrant", "playful", "bright", "fun", "loud"]],
  ["frosted", ["frosted", "glass", "blue", "soft", "airy"]],
  ["luxe-serif", ["luxe", "luxury", "elegant", "premium", "serif", "classy"]],
  ["high-contrast", ["high contrast", "contrast", "yellow", "accessible"]],
  ["ocean-calm", ["ocean", "calm", "teal", "green", "fresh", "natural"]],
];

export function currentPackId(html: string | null | undefined): string | null {
  const m = PACK_ID_RE.exec(html ?? "");
  return m ? m[1] : null;
}

/** Port of studio.draft.pick_style_pack: named pack if the prompt names one,
 * else the next pack in rotation. Rotation is what makes a bare "change the
 * theme" actually change it, and keeps changing it when the user asks again. */
export function pickStylePack(
  prompt: string | null | undefined,
  currentId: string | null = null,
): StylePack {
  const low = (prompt ?? "").toLowerCase();
  const themed = STYLE_PACKS.filter((p) => p.accent);
  for (const [packId, words] of PACK_KEYWORDS) {
    if (packId !== currentId && words.some((w) => low.includes(w))) {
      return themed.find((p) => p.id === packId)!;
    }
  }
  const ids = themed.map((p) => p.id);
  const idx = currentId !== null && ids.includes(currentId) ? ids.indexOf(currentId) + 1 : 0;
  return themed[idx % themed.length];
}

/** Port of studio.draft.apply_pack: swap the page's style pack. Idempotent —
 * replaces any existing pack. */
export function applyPack(html: string, pack: StylePack): string {
  const out = html.replace(PACK_BLOCK_RE, "");
  if (!pack.accent) return out;
  return out.replace("</head>", packCss(pack) + "</head>");
}

export interface Variant {
  id: string;
  label: string;
  html: string;
}

/** Port of studio.draft.make_variants: every distinct design for the genre
 * (read-only copies of the template files), followed by the style packs
 * applied to the first design. Template files themselves are never modified. */
export function makeVariants(prompt: string): [string, Variant[]] {
  const name = pickTemplate(prompt);
  const designs: Variant[] = [];
  for (const fname of templateFiles(name)) {
    const stem = fname.slice(0, -".html".length);
    const raw = readFileSync(path.join(templatesDir(), fname), "utf-8");
    designs.push({
      id: stem,
      label: designLabel(raw, stem, name),
      html: fillTemplate(raw, prompt, name),
    });
  }
  const packs: Variant[] = STYLE_PACKS.filter((p) => p.accent).map((p) => ({
    id: p.id,
    label: p.label,
    html: applyPack(designs[0].html, p),
  }));
  return [name, [...designs, ...packs]];
}

/** Port of studio.draft.make_draft: the unstyled first variant. */
export function makeDraft(prompt: string): [string, string] {
  const [name, variants] = makeVariants(prompt);
  return [name, variants[0].html];
}

export function writeVariants(runDir: string, variants: Variant[]): void {
  variants.forEach((v, i) => {
    writeFileSync(path.join(runDir, `draft-${i}.html`), v.html, "utf-8");
  });
}

export function writeDraft(runDir: string, html: string): string {
  const filePath = path.join(runDir, "draft.html");
  writeFileSync(filePath, html, "utf-8");
  return filePath;
}

// ---------------------------------------------------------------------------
// LLM-backed generate / refine / rewriteSection
// ---------------------------------------------------------------------------

function customizePrompt(prompt: string, html: string): string {
  return `You are customizing a copy of a website HTML template for a client.

Client request:
${prompt}

Rules:
- Change only text content, business details, menu/service/product items,
  and image alt text so the page fits the client request.
- Keep the HTML structure, CSS, class names, and overall design exactly
  as they are.
- Never add <script> tags.
- Output the complete customized HTML document and nothing else.

Template:
${html}`;
}

/** Port of studio.draft._extract_html_document. */
export function extractHtmlDocument(out: unknown): string | null {
  if (typeof out !== "string") return null;
  const text = stripMarkdownFences(out);
  const low = text.toLowerCase();
  let start = low.indexOf("<!doctype");
  if (start === -1) start = low.indexOf("<html");
  const end = low.lastIndexOf("</html>");
  if (start === -1 || end === -1 || end < start) return null;
  return text.slice(start, end + "</html>".length);
}

/** Port of studio.draft.customize — an LLM-personalized copy of a chosen
 * template. Operates on the in-memory copy only; template files are never
 * written. Returns customized HTML, or null if the model output is unusable.
 *
 * Named `generate` per the TS port surface (Python's `customize` is the
 * "generate the personalized draft from a template" entry point). */
export async function generate(
  provider: Provider,
  model: string,
  templateHtml: string,
  userPrompt: string,
): Promise<string | null> {
  const out = await provider.generate(model, customizePrompt(userPrompt, templateHtml), {
    numCtx: 32768,
  });
  if (typeof out !== "string") return null;
  const html = extractHtmlDocument(out);
  if (html === null) return null;
  return sanitizeHtml(html);
}

const REFINE_PROMPT_LOCKED = (prompt: string, html: string): string => `You are editing a static website HTML document.

User request:
${prompt}

Rules:
- You MAY add, remove, reorder, and rewrite sections to satisfy the request.
- Keep this a static site (HTML + CSS only). Never add JavaScript behavior.
- Never add <script> tags, inline event handlers, or javascript: URLs.
- Preserve valid HTML structure.
- Keep the existing visual style system exactly as-is:
  - Do NOT change fonts, typography scale, color palette, spacing scale,
    borders, shadows, or radius tokens.
  - Do NOT edit existing <style> blocks or stylesheet/font link tags.
  - Do NOT rename or remove existing CSS class names.
- If the request is content-only (name, copy, services, prices, contact info),
  only update content and leave design untouched.
- Output the complete HTML document and nothing else.

Current document:
${html}`;

const REFINE_PROMPT_STYLE = (prompt: string, html: string): string => `You are editing a static website HTML document.

User request:
${prompt}

Rules:
- You MAY add, remove, reorder, and rewrite sections to satisfy the request.
- You MAY adjust visual styling (fonts, palette, spacing, component styles)
  because the user explicitly asked for style/theme/design changes.
- Keep this a static site (HTML + CSS only). Never add JavaScript behavior.
- Never add <script> tags, inline event handlers, or javascript: URLs.
- Preserve valid HTML structure and keep styling cohesive.
- Output the complete HTML document and nothing else.

Current document:
${html}`;

const VISUAL_STYLE_HINT_RE =
  /\b(font|typography|style|styling|theme|palette|color|colour|redesign|restyle|look and feel|visual|appearance|dark mode|light mode|modern|minimal|brutalist|spacing|layout|layout style|button style|hero style|make it look|change the design)\b/i;
const STYLE_RESET_HINT_RE =
  /\b(original font|old font|keep original font|use original font|revert font|restore font|restore original style|reset style|same style|as before|undo style|revert style)\b/i;

const HEAD_RE = /(<head\b[^>]*>)([\s\S]*?)(<\/head>)/i;
const STYLE_TAG_RE = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
const STYLESHEET_LINK_RE = /<link\b(?=[^>]*\brel\s*=\s*["']stylesheet["'])[^>]*>/gi;
const FONT_LINK_RE = /<link\b(?=[^>]*(?:fonts\.googleapis|fonts\.gstatic|preconnect))[^>]*>/gi;

function wantsVisualRestyle(userPrompt: string | null | undefined): boolean {
  return VISUAL_STYLE_HINT_RE.test(userPrompt ?? "");
}

function wantsStyleReset(userPrompt: string | null | undefined): boolean {
  return STYLE_RESET_HINT_RE.test(userPrompt ?? "");
}

/** Every style asset in document order.
 *
 * Composed pages carry one <style> per component in the *body* (see
 * componentizer), so scanning only <head> loses the whole component CSS. */
function extractStyleAssets(html: string): string[] {
  const matches: Array<[number, string]> = [];
  for (const pattern of [FONT_LINK_RE, STYLESHEET_LINK_RE, STYLE_TAG_RE]) {
    for (const m of html.matchAll(pattern)) {
      matches.push([m.index ?? 0, m[0]]);
    }
  }
  matches.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const [, item] of matches) {
    if (seen.has(item)) continue;
    deduped.push(item);
    seen.add(item);
  }
  return deduped;
}

function styleCssBytes(html: string): number {
  let total = 0;
  for (const m of html.matchAll(STYLE_TAG_RE)) total += m[0].length;
  return total;
}

/** Port of studio.draft._lost_style_system (ponytail: byte-ratio heuristic —
 * a real restyle rewrites CSS; a model that dropped the component <style>
 * blocks loses most of it). Exported (Python keeps it private) so it can be
 * unit-tested directly. */
export function lostStyleSystem(originalHtml: string, editedHtml: string): boolean {
  const original = styleCssBytes(originalHtml);
  return original > 0 && styleCssBytes(editedHtml) < original * 0.6;
}

/** Port of studio.draft._preserve_style_system. Exported (Python keeps it
 * private) so it can be unit-tested directly. */
export function preserveStyleSystem(originalHtml: string, editedHtml: string): string {
  const m = HEAD_RE.exec(editedHtml);
  if (!m) return editedHtml;
  const styleAssets = extractStyleAssets(originalHtml);
  if (styleAssets.length === 0) return editedHtml;

  const matchStart = m.index;
  const openTag = m[1];
  const innerRaw = m[2];
  const openEnd = matchStart + openTag.length;
  const innerEnd = openEnd + innerRaw.length;
  const closeEnd = innerEnd + m[3].length;

  // Drop every style asset the model emitted anywhere, then re-inject the
  // originals into <head> in their original cascade order.
  let body = editedHtml.slice(closeEnd);
  for (const pattern of [STYLE_TAG_RE, STYLESHEET_LINK_RE, FONT_LINK_RE]) {
    body = body.replace(pattern, "");
  }

  let editedInner = innerRaw;
  for (const pattern of [STYLE_TAG_RE, STYLESHEET_LINK_RE, FONT_LINK_RE]) {
    editedInner = editedInner.replace(pattern, "");
  }
  const mergedInner = `${editedInner.replace(/\s+$/, "")}\n${styleAssets.join("\n")}\n`;
  return editedHtml.slice(0, openEnd) + mergedInner + editedHtml.slice(innerEnd, closeEnd) + body;
}

export interface RefineOptions {
  styleReferenceHtml?: string | null;
}

/** Port of studio.draft.refine: iteratively edit the live working copy for
 * the builder session. */
export async function refine(
  provider: Provider,
  model: string,
  workingHtml: string,
  userPrompt: string,
  options: RefineOptions = {},
): Promise<string | null> {
  const { styleReferenceHtml = null } = options;
  const resetRequested = wantsStyleReset(userPrompt);
  const styleRequested = wantsVisualRestyle(userPrompt);
  const promptFn = resetRequested
    ? REFINE_PROMPT_LOCKED
    : styleRequested
      ? REFINE_PROMPT_STYLE
      : REFINE_PROMPT_LOCKED;
  const out = await provider.generate(model, promptFn(userPrompt, workingHtml), { numCtx: 32768 });
  const html = extractHtmlDocument(out);
  if (html === null) return null;
  let sanitized = sanitizeHtml(html);
  if (resetRequested) {
    const source = styleReferenceHtml || workingHtml;
    sanitized = preserveStyleSystem(source, sanitized);
  } else if (!styleRequested || lostStyleSystem(workingHtml, sanitized)) {
    // A restyle may rewrite CSS, but it may never gut it: a model that
    // returned a near-styleless document gets the original CSS back.
    sanitized = preserveStyleSystem(workingHtml, sanitized);
  }
  return sanitized;
}

export function writeCustom(runDir: string, html: string): string {
  const filePath = path.join(runDir, "draft-custom.html");
  writeFileSync(filePath, html, "utf-8");
  return filePath;
}

export function readChoice(runDir: string): unknown {
  const filePath = path.join(runDir, "draft-choice.json");
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

// ---------------------------------------------------------------------------
// CTA anchors + images
// ---------------------------------------------------------------------------

/** Port of studio.draft.normalize_cta_anchors: replace placeholder href="#"
 * on CTAs with in-page section anchors. */
export function normalizeCtaAnchors(html: string): string {
  const ids = [...html.matchAll(/\bid="([A-Za-z][\w-]*)"/g)].map((m) => m[1]);
  if (ids.length === 0) return html;
  const idSet = new Set(ids);
  const contact = ["contact", "visit"].find((i) => idSet.has(i)) ?? null;
  const menu = ["menu", "list", "board", "bakes"].find((i) => idSet.has(i)) ?? null;
  const about =
    ["about", "story", "ritual", "process", "why", "method"].find((i) => idSet.has(i)) ?? null;
  const primary =
    menu ?? about ?? ids.find((i) => !["top", "contact", "visit"].includes(i)) ?? ids[0];
  const secondary = about ?? contact ?? primary;

  let out = html;
  if (idSet.has("top")) {
    out = out.replace(/(<a\b[^>]*class="[^"]*\bbrand\b[^"]*"[^>]*\b)href="#"/i, '$1href="#top"');
  }

  let btnIdx = 0;
  out = out.replace(/(<a\b[^>]*\bclass="[^"]*\bbtn[^"]*"[^>]*\b)href="#"/gi, (_full, g1: string) => {
    const target = btnIdx === 0 ? primary : secondary;
    btnIdx += 1;
    return `${g1}href="#${target}"`;
  });

  if (contact) {
    out = out.replace(/(<a\b[^>]*\b)href="#"(?=[^>]*>)/gi, `$1href="#${contact}"`);
  }
  return out;
}

const IMG_SRC_PAIR_RE = /(<img\b[^>]*\bsrc=")([^"]*)(")/gi;

/** Port of studio.draft.preserve_img_srcs: re-pin image URLs from the
 * original HTML onto a copy-rewritten version (cycling if the model added
 * <img> tags). */
export function preserveImgSrcs(originalHtml: string | null | undefined, newHtml: string): string {
  const srcs = [...(originalHtml ?? "").matchAll(IMG_SRC_PAIR_RE)].map((m) => m[2]);
  if (srcs.length === 0 || !newHtml) return newHtml;
  let slot = 0;
  return newHtml.replace(IMG_SRC_PAIR_RE, (_full, g1: string, _g2: string, g3: string) => {
    const src = srcs[slot % srcs.length];
    slot += 1;
    return `${g1}${src}${g3}`;
  });
}

const VALID_IMG_SRC_RE = /^(?:https?:\/\/|data:image\/)/i;
const INVALID_IMG_SRC_RE = /^(?:mock\+|s3:\/\/|\{\{|#|\s*$)/i;

const GENRE_IMAGE_FALLBACKS: Record<string, string[]> = {
  fitness: [
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=70",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=70",
  ],
  cafe: [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1522992319-0365e5f11656?auto=format&fit=crop&w=800&q=60",
  ],
  saas: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=70",
  ],
  generic: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=70",
  ],
};

function imgSrcOk(src: string | null | undefined): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  if (INVALID_IMG_SRC_RE.test(trimmed)) return false;
  if (/\s/.test(trimmed)) return false; // inner whitespace = a text pass scribbled on the attribute
  return VALID_IMG_SRC_RE.test(trimmed);
}

// Deviation: Python's _genre_fallback_url additionally mirrors the fallback
// image into S3 via studio.storage.s3.ensure_genre_placeholder_url and
// returns that public URL when available. studio/storage/s3.py is a separate
// module out of scope for this port (not among the assigned foundation
// files) — this always returns the raw fallback source URL.
function genreFallbackUrl(genre: string, slotIndex: number): string {
  const fallbacks = GENRE_IMAGE_FALLBACKS[genre] ?? GENRE_IMAGE_FALLBACKS.generic;
  return fallbacks[slotIndex % fallbacks.length];
}

// Deviation: Python's _resolve_img_src first tries
// studio.storage.s3.resolve_img_src(src) to rewrite mock+s3:// URLs, bare S3
// keys, or seeded https URLs to public asset URLs (see genreFallbackUrl
// above for why that's out of scope here) — this validates the given src
// directly instead.
function resolveImgSrc(src: string, genre: string, slotIndex: number): string {
  if (!imgSrcOk(src)) return genreFallbackUrl(genre, slotIndex);
  return src.trim();
}

/** Port of studio.draft.ensure_loadable_images: ensure img tags use
 * browser-loadable https/data URLs. */
export function ensureLoadableImages(html: string, genre = "generic"): string {
  let idx = 0;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcM = /\bsrc=(["'])([^"']*)\1/i.exec(tag);
    const rawSrc = srcM ? srcM[2] : "";
    const src = resolveImgSrc(rawSrc, genre, idx);
    idx += 1;
    let fixed = tag.replace(/\bsrc=(["'])[^"']*\1/i, `src="${src}"`);
    if (!fixed.toLowerCase().includes("referrerpolicy=")) {
      fixed = fixed.replace(/[/>\s]+$/, "") + ' referrerpolicy="no-referrer">';
    }
    return fixed;
  });
}

// ---------------------------------------------------------------------------
// Section rewrite
// ---------------------------------------------------------------------------

function sectionRewritePrompt(params: {
  sectionType: string;
  userPrompt: string;
  styleBlock: string;
  factsBlock: string;
  sectionHtml: string;
}): string {
  const { sectionType, userPrompt, styleBlock, factsBlock, sectionHtml } = params;
  return `You are rewriting the INNER HTML of one website section.

Section type: ${sectionType}

User intent:
${userPrompt}

Rules:
- Output ONLY the inner HTML for this section (no <html>, <head>, <body>, outer wrapper tags).
- Do NOT include a data-section attribute in your output; the caller preserves the wrapper.
- Change visible text only unless the user explicitly requests structural change.
- Preserve existing CSS class names on elements you keep.
- Never add <script>, inline event handlers, or javascript: URLs.
- Keep tone appropriate for the business.

${styleBlock}
${factsBlock}
Current section inner HTML:
${sectionHtml}`;
}

/** Port of studio.draft._extract_html_fragment. */
export function extractHtmlFragment(out: unknown): string | null {
  if (typeof out !== "string") return null;
  const text = stripMarkdownFences(out);
  const low = text.toLowerCase();
  if (low.includes("<html") || low.includes("<!doctype")) return null;
  const trimmed = text.trim();
  return trimmed === "" ? null : trimmed;
}

export interface RewriteSectionOptions {
  styleReferenceHtml?: string | null;
  numCtx?: number;
}

/** Port of studio.draft.refine_section — returns rewritten inner HTML only,
 * never a full document. Named `rewriteSection` per the TS port surface. */
export async function rewriteSection(
  provider: Provider,
  model: string,
  sectionHtml: string,
  sectionType: string,
  userPrompt: string,
  options: RewriteSectionOptions = {},
): Promise<string | null> {
  const { styleReferenceHtml = null, numCtx = 8192 } = options;
  let styleBlock = "";
  if (styleReferenceHtml) {
    styleBlock =
      "Surrounding page context (preserve visual language; do not copy verbatim):\n" +
      `${styleReferenceHtml.slice(0, 4000)}\n`;
  }
  const factsBlock = ""; // generation callers embed facts in user_prompt
  const prompt = sectionRewritePrompt({
    sectionType,
    userPrompt,
    styleBlock,
    factsBlock,
    sectionHtml,
  });
  const out = await provider.generate(model, prompt, { numCtx });
  const fragment = extractHtmlFragment(out);
  if (fragment === null) return null;
  return sanitizeHtml(fragment);
}
