import { applyPatch as rfcApply, compare as rfcCompare, type Operation } from "fast-json-patch";

export type JsonPatchOp = Operation;

export function applyJsonPatch<T>(target: T, patch: JsonPatchOp[]): T {
  const clone = structuredClone(target) as object;
  rfcApply(clone, patch, true, true);
  return clone as T;
}

export function diffJsonPatch<T>(before: T, after: T): JsonPatchOp[] {
  return rfcCompare(before as object, after as object);
}

export function invertPatch(patch: JsonPatchOp[]): JsonPatchOp[] {
  return [...patch].reverse().map((op) => {
    if (op.op === "add") return { op: "remove", path: op.path };
    if (op.op === "remove") return { op: "add", path: op.path, value: (op as { value?: unknown }).value };
    if (op.op === "replace") {
      const old = (op as { oldValue?: unknown }).oldValue;
      return { op: "replace", path: op.path, value: old };
    }
    return op;
  });
}

/** Convert dotted/bracket path (e.g. services.items[0].title) to JSON Pointer under /content. */
export function contentPathToPatch(path: string, value: unknown): JsonPatchOp[] {
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");
  const segments = normalized.split(".").filter(Boolean);
  return [{ op: "replace", path: `/content/${segments.join("/")}`, value }];
}

export function themePathToPatch(path: string, value: unknown): JsonPatchOp[] {
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");
  const segments = normalized.split(".").filter(Boolean);
  return [{ op: "replace", path: `/theme/${segments.join("/")}`, value }];
}
