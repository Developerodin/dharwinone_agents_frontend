import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Dev preview of the ORIGINAL HTML templates (conversion feedstock, master plan v2 §2.6).
// Serves backend/assets/templates/<name>.html read-only.
const TEMPLATES_DIR = path.resolve(process.cwd(), "..", "..", "backend", "assets", "templates");

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  // strict allowlist shape: letters/digits/hyphen only, no traversal
  if (!/^[a-z0-9-]+$/i.test(name)) return new NextResponse("Not found", { status: 404 });
  try {
    const html = await readFile(path.join(TEMPLATES_DIR, `${name}.html`), "utf-8");
    return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
