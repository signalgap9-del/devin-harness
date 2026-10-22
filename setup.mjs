#!/usr/bin/env node
// setup.mjs — bootstrap devin-harness into any repo.
//   node setup.mjs <target-repo-path> [--force] [--with-docs]
//
// Copies the RUNNABLE layer (hooks + guards + skills + templates + config)
// into the target repo. Never overwrites existing files unless --force.
// Docs are optional (--with-docs) — they're knowledge, not machinery.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SELF = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const args = process.argv.slice(2);
const TARGET = resolve(args.find(a => !a.startsWith("--")) || ".");
const FORCE = args.includes("--force");
const WITH_DOCS = args.includes("--with-docs");

if (!existsSync(join(TARGET, ".git"))) {
  console.error(`target ${TARGET} is not a git repo — run git init first`);
  process.exit(1);
}

const COPIES = [
  [".devin/config.json", true],
  [".devin/hooks.v1.json", true],
  [".devin/hooks.extended.example.json", true],
  [".devin/mcp_config.example.json", true],
  [".devin/skills", true],
  ["ops/verify/agent-guard.mjs", true],
  ["ops/verify/file-guard.mjs", true],
  ["ops/verify/agent-ledger.mjs", true],
  ["ops/verify/session-start.mjs", true],
  ["ops/verify/prompt-guard.mjs", true],
  ["ops/verify/claim-guard.mjs", true],
  ["ops/verify/business-metrics.example.mjs", true],
  ["ops/verify/README.md", true],
  ["templates/agents", true],
  ["templates/decisions", true],
  ["templates/incidents", true],
  ["AGENTS.example.md", true],
];
if (WITH_DOCS) COPIES.push(["docs", true]);

let copied = 0, skipped = 0;
for (const [rel] of COPIES) {
  const src = join(SELF, rel), dst = join(TARGET, rel);
  if (existsSync(dst) && !FORCE) { console.log(`skip   ${rel} (exists — --force to overwrite)`); skipped++; continue; }
  mkdirSync(join(dst, ".."), { recursive: true });
  cpSync(src, dst, { recursive: true });
  console.log(`copy   ${rel}`);
  copied++;
}

// .gitignore additions (ledger runtime state) — append if absent
const GI = join(TARGET, ".gitignore");
const need = ["ops/verify/action-log.jsonl", ".devin/mcp_config.local.json"];
const cur = existsSync(GI) ? readFileSync(GI, "utf8") : "";
const add = need.filter(l => !cur.includes(l));
if (add.length) writeFileSync(GI, cur + (cur.endsWith("\n") || !cur ? "" : "\n") + add.join("\n") + "\n");

// AGENTS.md bootstrap: only if missing — never clobber the project's own
const AG = join(TARGET, "AGENTS.md");
if (!existsSync(AG)) {
  cpSync(join(SELF, "AGENTS.example.md"), AG);
  console.log("copy   AGENTS.example.md -> AGENTS.md  (adapting is your job — see docs/agents-md-layering.md)");
} else console.log("keep   AGENTS.md (exists — merge AGENTS.example.md manually if wanted)");

console.log(`\ndone: ${copied} copied, ${skipped} skipped.`);
console.log(`next:  1) adapt AGENTS.md to this repo (≤100 lines, see docs/agents-md-layering.md)`);
console.log(`       2) fill .devin/mcp_config.local.json from the example (secrets stay local)`);
console.log(`       3) test the guard: node ops/verify/agent-guard.mjs should exist + run <50ms`);
