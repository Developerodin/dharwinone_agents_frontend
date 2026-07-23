import { create } from "zustand";
import type { SiteConfig } from "@/lib/site-config";
import { applyJsonPatch, diffJsonPatch, type JsonPatchOp } from "@/lib/json-patch";
import type { SectionKey } from "@/templates/system/types";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface HistoryEntry {
  forward: JsonPatchOp[];
  backward: JsonPatchOp[];
  label?: string;
}

interface SiteEditorState {
  config: SiteConfig | null;
  selectedSection: SectionKey | null;
  selectedElementKey: string | null;
  device: PreviewDevice;
  saveStatus: SaveStatus;
  past: HistoryEntry[];
  future: HistoryEntry[];
  aiProposal: { sectionKey: SectionKey; content: Record<string, unknown> } | null;

  loadConfig: (config: SiteConfig) => void;
  dispatch: (patch: JsonPatchOp[], label?: string) => void;
  replaceConfig: (config: SiteConfig, label?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setSelectedSection: (key: SectionKey | null) => void;
  setSelectedElement: (key: string | null) => void;
  setDevice: (device: PreviewDevice) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setAiProposal: (proposal: SiteEditorState["aiProposal"]) => void;
  acceptAiProposal: () => void;
  discardAiProposal: () => void;
}

const MAX_HISTORY = 100;

export const useSiteEditorStore = create<SiteEditorState>((set, get) => ({
  config: null,
  selectedSection: null,
  selectedElementKey: null,
  device: "desktop",
  saveStatus: "idle",
  past: [],
  future: [],
  aiProposal: null,

  loadConfig: (config) =>
    set({
      config,
      past: [],
      future: [],
      saveStatus: "idle",
      selectedSection: null,
      selectedElementKey: null,
      aiProposal: null,
    }),

  dispatch: (patch, label) => {
    const { config, past } = get();
    if (!config || patch.length === 0) return;
    const before = structuredClone(config);
    const after = applyJsonPatch(before, patch);
    const backward = diffJsonPatch(after, before);
    const entry: HistoryEntry = { forward: patch, backward, label };
    set({
      config: after,
      past: [...past, entry].slice(-MAX_HISTORY),
      future: [],
      saveStatus: "dirty",
    });
  },

  replaceConfig: (next, label) => {
    const { config, past } = get();
    if (!config) {
      set({ config: next });
      return;
    }
    const forward = diffJsonPatch(config, next);
    if (forward.length === 0) return;
    const backward = diffJsonPatch(next, config);
    const entry: HistoryEntry = { forward, backward, label };
    set({
      config: next,
      past: [...past, entry].slice(-MAX_HISTORY),
      future: [],
      saveStatus: "dirty",
    });
  },

  undo: () => {
    const { config, past, future } = get();
    if (!config || past.length === 0) return;
    const entry = past[past.length - 1];
    const next = applyJsonPatch(structuredClone(config), entry.backward);
    set({
      config: next,
      past: past.slice(0, -1),
      future: [entry, ...future],
      saveStatus: "dirty",
    });
  },

  redo: () => {
    const { config, past, future } = get();
    if (!config || future.length === 0) return;
    const entry = future[0];
    const next = applyJsonPatch(structuredClone(config), entry.forward);
    set({
      config: next,
      past: [...past, entry],
      future: future.slice(1),
      saveStatus: "dirty",
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  setSelectedSection: (key) => set({ selectedSection: key, selectedElementKey: null }),
  setSelectedElement: (key) => set({ selectedElementKey: key }),
  setDevice: (device) => set({ device }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),

  setAiProposal: (aiProposal) => set({ aiProposal }),

  acceptAiProposal: () => {
    const { aiProposal, config, dispatch } = get();
    if (!aiProposal || !config) return;
    dispatch(
      [{ op: "replace", path: `/content/${aiProposal.sectionKey}`, value: aiProposal.content }],
      `Accept AI ${aiProposal.sectionKey}`,
    );
    set({ aiProposal: null });
  },

  discardAiProposal: () => set({ aiProposal: null }),
}));

export function selectVisibleSectionKeys(config: SiteConfig): SectionKey[] {
  const hidden = new Set(config.theme.hiddenSections);
  return config.theme.sectionOrder.filter((k) => !hidden.has(k));
}
