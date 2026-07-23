/** WCAG contrast helpers — warn on pick, one-click fix (plan §8.1). */

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(fg: string, bg: string): number | null {
  const f = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!f || !b) return null;
  const l1 = relativeLuminance(...f);
  const l2 = relativeLuminance(...b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastLevel = "pass_aa" | "warn_aa" | "fail_aa";

export function checkContrast(fg: string, bg: string): {
  ratio: number | null;
  level: ContrastLevel;
  message: string;
} {
  const ratio = contrastRatio(fg, bg);
  if (ratio === null) {
    return { ratio: null, level: "warn_aa", message: "Could not evaluate contrast for this color pair." };
  }
  if (ratio >= 4.5) {
    return { ratio, level: "pass_aa", message: `Contrast ${ratio.toFixed(1)}:1 meets WCAG AA.` };
  }
  if (ratio >= 3) {
    return {
      ratio,
      level: "warn_aa",
      message: `Contrast ${ratio.toFixed(1)}:1 is below WCAG AA (4.5:1). Large text may be OK.`,
    };
  }
  return {
    ratio,
    level: "fail_aa",
    message: `Contrast ${ratio.toFixed(1)}:1 fails WCAG AA. Consider adjusting colors.`,
  };
}

const LIGHT_TEXT = ["#FFFFFF", "#F8FAFC", "#F1F5F9", "#E2E8F0"];
const DARK_TEXT = ["#0F172A", "#111827", "#1E293B", "#000000"];

/** Pick accessible text color against bg; keeps fg if already AA. */
export function suggestAccessibleTextColor(fg: string, bg: string): string {
  if ((contrastRatio(fg, bg) ?? 0) >= 4.5) return fg;

  const bgRgb = hexToRgb(bg);
  if (!bgRgb) return fg;

  const bgLum = relativeLuminance(...bgRgb);
  const candidates = bgLum > 0.5 ? DARK_TEXT : LIGHT_TEXT;
  for (const candidate of candidates) {
    if ((contrastRatio(candidate, bg) ?? 0) >= 4.5) return candidate;
  }

  // Last resort: force high-contrast pair
  return bgLum > 0.5 ? "#000000" : "#FFFFFF";
}
