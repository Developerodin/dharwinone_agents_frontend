// Port of backend/studio/consent.py — SCOPED to what the ported routes need:
// reading the consent ledger (GET /projects/{projectId}/consent-ledger).
//
// NOT ported: make_policy() and wrap_provider(). Both are runs-engine
// concerns — make_policy() returns a policy callback consumed by the
// provider-selection code in the (unported) runs subsystem, and
// wrap_provider() wraps a live LLM provider's generate() to append ledger
// lines as runs execute. Neither has anything to hook into on the TS side
// yet (no runs engine, no provider abstraction), so porting them now would
// be dead code around a shape that doesn't exist. Deferred to the runs
// engine port at N5.
import fs from "node:fs";
import { consentPath } from "./paths";

export type ConsentLedgerEntry = {
  ts: number;
  run_id: string;
  stage: string;
  kind: string;
  model: string;
  prompt_bytes: number;
  prompt_sha256: string;
};

export function readLedger(projectId: string): ConsentLedgerEntry[] {
  const p = consentPath(projectId);
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, "utf-8");
  const out: ConsentLedgerEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed) out.push(JSON.parse(trimmed) as ConsentLedgerEntry);
  }
  return out;
}
