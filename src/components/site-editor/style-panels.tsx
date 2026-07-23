"use client";

import { PALETTE_PRESETS } from "@/lib/palette-presets";
import { applyPalettePreset } from "@/lib/site-config";
import { useSiteEditorStore } from "@/store/site-editor-store";

export function PalettePanel() {
  const config = useSiteEditorStore((s) => s.config);
  const replaceConfig = useSiteEditorStore((s) => s.replaceConfig);
  if (!config) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-textmuted">Palette presets</h3>
      <div className="grid grid-cols-2 gap-2">
        {PALETTE_PRESETS.map((preset) => {
          const active = config.theme.palettePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                const next = { ...config, theme: applyPalettePreset(config.theme, preset.id) };
                replaceConfig(next, `Palette: ${preset.label}`);
              }}
              className={`rounded-lg border p-2 text-left transition-shadow ${
                active ? "border-brand-green ring-1 ring-brand-green" : "border-defaultborder hover:shadow-sm"
              }`}
            >
              <div className="mb-1.5 flex gap-1">
                {[preset.primary, preset.accent, preset.neutral, preset.bg].map((c, i) => (
                  <span
                    key={`${preset.id}-swatch-${i}`}
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-defaulttextcolor">{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BrandColorsPanel() {
  const config = useSiteEditorStore((s) => s.config);
  const dispatch = useSiteEditorStore((s) => s.dispatch);
  if (!config) return null;

  const fields: { key: keyof typeof config.theme.brand; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "accent", label: "Accent" },
    { key: "neutral", label: "Text / ink" },
    { key: "bg", label: "Page background" },
    { key: "surface", label: "Surface" },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-textmuted">Brand colors</h3>
      {fields.map(({ key, label }) => {
        const value = config.theme.brand[key] as string;
        return (
          <label key={key} className="block">
            <span className="mb-1 block text-xs font-medium text-defaulttextcolor">{label}</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value.startsWith("#") ? value : "#000000"}
                onChange={(e) =>
                  dispatch([{ op: "replace", path: `/theme/brand/${key}`, value: e.target.value }], `Brand ${key}`)
                }
                className="h-9 w-12 cursor-pointer rounded border border-inputborder bg-white p-0.5"
              />
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  dispatch([{ op: "replace", path: `/theme/brand/${key}`, value: e.target.value }], `Brand ${key}`)
                }
                className="form-control flex-1 font-mono text-xs"
              />
            </div>
          </label>
        );
      })}
    </div>
  );
}
