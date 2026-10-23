// jev-gate.mjs — typed judgment over a diff + persistent review memory.
//   node ops/verify/jev-gate.mjs [--base-ref origin/main] [--spec file]
//
// Layers:
//   1. deterministic checks — facts no model can veto (dep supply-chain,
//      unvetted endpoints). Extend detViolations below for project rules.
//   2. Jev — checkConstraints() asks every constraint in one judge() call;
//      0.8 threshold blocks. No key / no jev-use → advisory-only, det still gates.
//   3. state.json synapse — persistent review memory: per-file strikes,
//      violation counts, resolution receipts. A finding whose file+constraint
//      has a receipt DOWNGRADES deterministically — the model only ever
//      blocks on NEW findings. That's what makes the loop converge.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { auditDiff } from "./dep-audit.mjs";
import { jevClient, checkConstraints } from "./jev-client.mjs";

const DIR = fileURLToPath(new URL(".", import.meta.url));
const ROOT = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i > -1 ? args[i + 1] : d; };
const BASE_REF = opt("base-ref", "HEAD");
const IS_CI = !!process.env.CI;

/* PROJECT: paths the gate judges. Start broad, narrow to deploy-affecting
   trees — judging ops/experiments produced false "unrequested scope". */
const PATHS = opt("paths", "").split(",").filter(Boolean);

const STATE_FILE = DIR + "state.json";
const state = existsSync(STATE_FILE)
  ? JSON.parse(readFileSync(STATE_FILE, "utf8"))
  : { runs: 0, fileStrikes: {}, violationCounts: {}, obligations: [], resolutions: [], history: [] };

/* --spec <file>: idea-stage audit — reject a bad proposal before code
   exists (cheaper than rejecting a bad diff). Same constraint schema. */
const SPEC_FILE = opt("spec", "");
let diff = "", files = [];
if (SPEC_FILE) {
  diff = "SPEC / PROPOSAL UNDER REVIEW (no code yet):\n" + readFileSync(SPEC_FILE, "utf8");
  files = ["<spec>"];
} else {
  const range = BASE_REF === "HEAD" ? "HEAD" : `${BASE_REF}...HEAD`;
  const pathArgs = PATHS.length ? ["--", ...PATHS] : [];
  try { diff = execFileSync("git", ["diff", range, "--unified=1", ...pathArgs], { cwd: ROOT, encoding: "utf8" }); }
  catch { diff = execFileSync("git", ["diff", "HEAD", "--unified=1", ...pathArgs], { cwd: ROOT, encoding: "utf8" }); }

  /* git diff never shows untracked files — a new file would bypass review.
     Fold them in as pseudo-hunks inside the same path scope. */
  const untracked = execFileSync("git", ["status", "--porcelain", ...pathArgs], { cwd: ROOT, encoding: "utf8" })
    .split("\n").filter((l) => l.startsWith("?? "))
    .map((l) => l.slice(3).trim().replace(/^"|"$/g, ""));
  for (const f of untracked) {
    if (f.endsWith("/")) continue;
    let body = ""; try { body = readFileSync(ROOT + f, "utf8"); } catch { continue; }
    if (body.length > 4000) body = body.slice(0, 4000) + "\n…[file truncated]";
    diff += `\ndiff --git a/${f} b/${f} (untracked)\n+++ b/${f}\n${body.split("\n").map((l) => "+" + l).join("\n")}\n`;
  }
  if (!diff.trim()) { console.log(JSON.stringify({ ok: true, skipped: "empty diff" })); process.exit(0); }
  files = [...diff.matchAll(/^diff --git a\/(\S+)/gm)].map((m) => m[1]);
}
/* fullDiff survives for deterministic scans — the 28KB cap exists for the
   model's token budget, not for fact checks. */
const fullDiff = diff;
if (diff.length > 28000) diff = diff.slice(0, 28000) + "\n…[truncated]";

/* ── deterministic layer 1: new dependencies vs public truth ── */
const depAudit = SPEC_FILE ? { deps: [], blocking: [], warnings: [] } : await auditDiff(diff).catch(() => ({ deps: [], blocking: [], warnings: [] }));

/* agent behavior: what the agent DID this session — judged alongside the
   diff, not just the output. */
let actionLog = [];
try {
  const lines = readFileSync(DIR + "action-log.jsonl", "utf8").trim().split("\n").slice(-60);
  actionLog = lines.map((l) => JSON.parse(l)).filter((e) => !["read", "grep", "get_output"].includes(e.tool));
} catch {}

/* ── deterministic layer 2: unvetted endpoints ──
   Allowlist = hostnames the repo already spoke at HEAD + APPROVED below.
   Any NEW code URL needs owner sign-off — inertia provider-picks block. */
const APPROVED_NEW_HOSTS = new Set([
  // PROJECT: add owner-approved endpoints here with a reason + date comment.
]);
let baseHosts = new Set();
try {
  const g = execFileSync(
    "git", ["grep", "-h", "-o", "-E", "wss?://[a-z0-9.-]+|https://[a-z0-9.-]+", BASE_REF === "HEAD" ? "HEAD" : BASE_REF, "--", "*.ts", "*.tsx", "*.mjs", "*.cjs", "*.js"],
    { cwd: ROOT, encoding: "utf8" },
  );
  for (const m of g.matchAll(/(?:wss?|https):\/\/([a-z0-9.-]+)/gi)) baseHosts.add(m[1].toLowerCase());
} catch (e) {
  // Empty baseline → every hostname is new → fail-loud direction.
  console.error("jev-gate: hostname baseline scan failed — endpoint gate runs with empty allowlist", e);
}
const detViolations = [];
{
  let curFile = "";
  const newHosts = new Map();
  for (const line of fullDiff.split("\n")) {
    const f = line.match(/^\+\+\+ b\/(\S+)/);
    if (f) { curFile = f[1]; continue; }
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    if (!/\.(ts|tsx|mjs|cjs|js)$/.test(curFile) || /\.test\.|__tests__/.test(curFile)) continue;
    for (const m of line.matchAll(/(?:wss?|https):\/\/([a-z0-9.-]+)/gi)) {
      const h = m[1].toLowerCase();
      if (!baseHosts.has(h) && !APPROVED_NEW_HOSTS.has(h) && !newHosts.has(h)) newHosts.set(h, curFile);
    }
  }
  for (const [h, f] of newHosts)
    detViolations.push({
      file: f, constraint: "unvetted_endpoint", confidence: 1,
      evidence: `new external endpoint "${h}" — new provider/API dependencies need explicit owner sign-off (no inertia picks)`,
    });
}
/* PROJECT: append project deterministic checks here — provider scope rules,
   locale parity, vendor-port completeness, copy-surface scans. Deterministic
   findings carry confidence 1; a model can never veto a fact. */

/* ── model layer: Jev only. Plan text rides along so "different architecture
   than planned" is decidable, not vibes. */
let planText = "";
for (const p of ["tasks/plan.md", "PLAN.md"]) {
  try { planText = readFileSync(ROOT + p, "utf8").slice(0, 6000); break; } catch {}
}
const jevState =
  `Files changed: ${files.join(", ")}\n` +
  (planText ? `\nCURRENT PLAN (the approved approach this work must follow):\n${planText}\n` : "") +
  `\nDIFF:\n${diff}` +
  (actionLog.length
    ? `\n\nAGENT ACTION LOG (what the agent did this session):\n${actionLog.map((e) => `${e.tool}: ${JSON.stringify(e.input).slice(0, 140)}`).join("\n").slice(0, 6000)}`
    : "");
const constraintResults = (await jevClient()) ? await checkConstraints(jevState) : null;
const jevConfirmed = [], jevRejected = [];
if (constraintResults) {
  for (const [constraint, r] of Object.entries(constraintResults)) {
    if (r.confirmed)
      jevConfirmed.push({ file: "(diff)", constraint, confidence: r.confidence, evidence: `jev direct check @ ${r.confidence.toFixed(2)}` });
    else
      jevRejected.push(`unconfirmed ${constraint}${r.escalate ? " (jev escalated)" : ` (jev conf ${r.confidence?.toFixed?.(2) ?? "?"})`}`);
  }
}

/* Resolution receipts: a violation whose file+constraint already resolved
   is DOWNGRADED to a note — deterministically, no relitigation. */
const resolved = (v) =>
  (state.resolutions || []).some((r) => r.file === v.file && r.constraint === v.constraint);
const openViolations = [...jevConfirmed, ...detViolations].filter((v) => !resolved(v));

const depBlocking = depAudit.blocking.map((b) => ({
  file: b.file, constraint: "dependency_risk", confidence: 1,
  evidence: `${b.name}@${b.resolved || b.spec}: ${b.checks.join("; ")}`,
}));
const blocking = [...openViolations.filter((v) => v.confidence >= 0.7), ...depBlocking];

/* ── synapse: write deltas back into persistent review memory ── */
if (!IS_CI) {
  state.runs++;
  for (const v of openViolations) {
    state.fileStrikes[v.file] = (state.fileStrikes[v.file] || 0) + 1;
    state.violationCounts[v.constraint] = (state.violationCounts[v.constraint] || 0) + 1;
  }
  state.obligations = [...new Set([...jevRejected, ...state.obligations])].slice(-30);
  state.history.push({ ts: new Date().toISOString(), files: files.length, violations: openViolations.length });
  state.history = state.history.slice(-50);
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

console.log(JSON.stringify({
  ok: blocking.length === 0, blocking,
  violations: openViolations,
  adjudication: { constraints: constraintResults ? Object.keys(constraintResults).length : 0, confirmed: jevConfirmed.length, jev: (await jevClient()) ? "live" : "offline" },
  memory: { runs: state.runs, fileStrikes: state.fileStrikes },
}, null, 2));
// exitCode, not process.exit — keep-alive handles abort mid-shutdown on Windows.
process.exitCode = blocking.length ? 1 : 0;
