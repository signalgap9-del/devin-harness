#!/usr/bin/env node
// session-start.mjs — SessionStart hook payload.
// Runs at session open; prints a compact state report the agent reads as
// context. Goal: session starts INFORMED — drift, locks, dirty tree —
// instead of discovering problems mid-task. <200ms, no network, no model.
//
// Register under your harness's session-start event. If the event doesn't
// exist in your harness, run it as the first command of each session.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const out = [];
const sh = (cmd, a) => { try { return execFileSync(cmd, a, { encoding: "utf8", timeout: 5000 }).trim(); } catch { return ""; } };

// 1. working tree state — dirty files the agent must know about
const dirty = sh("git", ["status", "--porcelain"]).split("\n").filter(Boolean);
out.push(`git: ${dirty.length} uncommitted path(s)` +
  (dirty.length ? ` — review before assuming a clean base:\n  ${dirty.slice(0, 8).join("\n  ")}${dirty.length > 8 ? "\n  …" : ""}` : ""));

// 2. branch + last commit
out.push(`head: ${sh("git", ["rev-parse", "--abbrev-ref", "HEAD"])} @ ${sh("git", ["log", "-1", "--oneline"])}`);

// 3. stale locks (deploy/verify)
for (const lf of ["ops/verify/.deploy.lock", ".deploy.lock", "ops/verify/.verify.lock"]) {
  if (existsSync(lf)) out.push(`LOCK PRESENT: ${lf} — check liveness before running gates (stale locks have killed deploys before)`);
}

// 4. unresolved obligations from the review synapse (if present)
if (existsSync("ops/verify/state.json")) {
  try {
    const s = JSON.parse(readFileSync("ops/verify/state.json", "utf8"));
    const open = (s.obligations || []).filter(o => !o.resolved);
    if (open.length) out.push(`review obligations OPEN (${open.length}): ${open.slice(0, 5).map(o => o.summary || o).join(" | ")}`);
  } catch { /* unreadable state → say nothing, don't fail the hook */ }
}

// 5. incident index pointer (if the folder exists)
if (existsSync("docs/incidents")) {
  const n = readdirSync("docs/incidents").filter(f => f.endsWith(".md")).length;
  if (n) out.push(`incidents: ${n} recorded — consult docs/incidents/ before touching their subsystems`);
}

console.log(out.join("\n"));
