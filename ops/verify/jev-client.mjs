// jev-client.mjs — the Jev layer over jev-use (typed Jev verdicts).
// Jev is the ONLY paid model in the review path — bounded check() per
// constraint, 0.8 threshold before it blocks. Deterministic layers can't
// be vetoed by any model and run even when the key is absent.
//
// Key resolution: env TYPESAFE_API_KEY → .env/.dev.vars (never committed).
// Missing key → jevClient() returns null → model layer advisory-only.
// Package: jev-use (MIT, typesafe.ai). Lazy-imported — if it isn't
// installed the gate still runs deterministically.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

export function loadTypesafeKey() {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY;
  for (const f of [".env", ".dev.vars", "apps/web/.dev.vars"]) {
    try {
      const m = readFileSync(ROOT + f, "utf8").match(/^TYPESAFE_API_KEY=(.+)$/m);
      if (m?.[1]?.trim()) return m[1].trim().replace(/^["']|["']$/g, "");
    } catch { /* unreadable → advisory-only; callers must treat null as such */ }
  }
  return "";
}

let mod, client;
async function jevUse() {
  if (mod === undefined) {
    try { mod = await import("jev-use"); }
    catch { mod = null; console.error("jev-client: jev-use not installed — npm i -D jev-use for the model layer"); }
  }
  return mod;
}
export async function jevClient() {
  if (client === undefined) {
    const j = await jevUse();
    const key = loadTypesafeKey();
    client = j && key ? new j.Jev({ env: { TYPESAFE_API_KEY: key } }) : null;
  }
  return client;
}

/* Universal constraint vocabulary — each description is a self-contained
   predicate decidable from the diff alone. Concrete predicates get verdicts;
   vague ones get escalations. Append project constraints in jev-gate.mjs. */
export const CONSTRAINT_DESC = {
  unrequested_scope: "a change that does something unasked-for (new UI surface, extra feature, drive-by refactor)",
  weakened_bar: "new @ts-ignore/eslint-disable suppressions, skipped or deleted tests, stripped assertions, or stubs left unimplemented",
  unverified_claim_path: "a new delivery path nothing verifies (auth-gated/iframe/embed path with no test through it)",
  unverifiable_claim: "user-facing copy asserting something nobody can audit (provider-side retention claims, 'nothing logged', 'never stored') — state the plain promise only",
  jargon_in_copy: "provider/model names, protocol jargon, or unexplained acronyms in public-facing copy",
  broken_contract: "a change to an API/data/env contract that doesn't update its consumers",
  a11y_surface: "dynamic text without aria-live, unlabeled icon-only controls, keyboard-unreachable UI, or motion without reduced-motion fallback",
  spec_gap: "a proposal implying a delivery path no one will verify, or assuming capabilities the system doesn't have",
  agent_behavior: "agent actions violating working rules (unrequested builds, convenience/inertia tool-picks, claiming done without receipts, manual repetitive work)",
  symptom_patch: "a fix that suppresses a symptom instead of the mechanism — only changing a cap/timeout, adding only a kill-switch/retry, swallowing errors — while the underlying bug can still happen",
  plan_drift: "a diff implementing a materially different architecture or approach than the plan specifies — judge against the plan text, not the diff's own comments",
  destructive_cloud_op: "code/scripts that delete, disable, or shrink cloud identity/project resources — project delete, billing unlink, service-account/OAuth-client/key delete, IAM role removal, service disable, VM/bucket destruction",
  silent_failure: "code that can break a user-facing/money/alert path without operator-visible signal — empty catches on critical paths, quiet alert-channel failure, 'best-effort' calls leaving the site looking healthy",
  privileged_view_claim: "asserting a user-facing path works from a privileged/partial view — admin account succeeds, URL returns 200 — without the stranger's journey verified end-to-end",
};

/* One judge() call checks every constraint at once. 0.8 = owner-set
   blocking threshold — Jev must be fairly sure before it blocks. */
export async function checkConstraints(state, extra = {}) {
  const jev = await jevClient();
  if (!jev) return null;
  const { check } = await jevUse();
  const descs = { ...CONSTRAINT_DESC, ...extra };
  const qs = Object.fromEntries(
    Object.entries(descs).map(([c, d]) => [
      c,
      check(`Does this diff introduce ${d}? Answer true only when a hunk/action itself shows it — not a hypothetical risk, not something a deterministic check already covers, not code outside this diff.`),
    ]),
  );
  const { answers } = await jev.judge(state, qs);
  return Object.fromEntries(
    Object.entries(answers).map(([c, a]) => {
      const p = typeof a.answer === "number" ? a.answer : a.answer === true ? 1 : 0;
      return [c, { confirmed: p >= 0.8 && a.escalate !== true, confidence: p, escalate: a.escalate === true }];
    }),
  );
}
