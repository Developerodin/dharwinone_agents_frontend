"use client";

import { checkContrast, suggestAccessibleTextColor } from "@/lib/contrast";

export function ContrastWarning({
  fg,
  bg,
  onFixText,
}: {
  fg: string;
  bg: string;
  onFixText?: (fixedFg: string) => void;
}) {
  const result = checkContrast(fg, bg);
  if (result.level === "pass_aa") return null;

  const tone =
    result.level === "fail_aa"
      ? "border-danger/30 bg-red-50 text-red-800"
      : "border-warning/30 bg-amber-50 text-amber-900";

  const fixedFg = suggestAccessibleTextColor(fg, bg);
  const canAutoFix = fixedFg !== fg && onFixText;

  return (
    <div className={`mt-2 rounded-md border px-2.5 py-2 text-xs ${tone}`} role="status">
      <p className="m-0">{result.message}</p>
      {canAutoFix ? (
        <button
          type="button"
          className="mt-2 rounded-md border border-current/20 bg-white/60 px-2 py-1 text-xs font-medium hover:bg-white"
          onClick={() => onFixText(fixedFg)}
        >
          Fix for me
        </button>
      ) : null}
    </div>
  );
}
