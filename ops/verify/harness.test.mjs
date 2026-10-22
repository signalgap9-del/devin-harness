// harness.test.mjs — smoke tests for the runnable layer.
// `node --test ops/verify/` — this is the repo's own CI gate, the piece
// that moves us to "process-artifact-grade" (GOV.UK repos all run public CI).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const V = join(ROOT, "ops", "verify");

const pipe = (script, input) =>
  spawnSync("node", [join(V, script)], { input, encoding: "utf8", cwd: ROOT });

test("agent-guard blocks rm -rf with exit 2 + reason", () => {
  const r = pipe("agent-guard.mjs", JSON.stringify({ tool_input: { command: "rm -rf /tmp/x" } }));
  assert.equal(r.status, 2);
  assert.match(r.stdout, /block|destructive/i);
});

test("agent-guard blocks git config", () => {
  const r = pipe("agent-guard.mjs", JSON.stringify({ tool_input: { command: "git config user.email a@b.c" } }));
  assert.equal(r.status, 2);
});

test("agent-guard allows normal commands", () => {
  const r = pipe("agent-guard.mjs", JSON.stringify({ tool_input: { command: "ls -la" } }));
  assert.equal(r.status, 0);
});

test("agent-guard fails CLOSED on unparseable input", () => {
  const r = pipe("agent-guard.mjs", "not json at all");
  assert.equal(r.status, 2);
});

test("prompt-guard injects source-verification on external questions", () => {
  const r = pipe("prompt-guard.mjs", "does langfuse support datasets and what is the latest pricing?");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /SOURCE-VERIFICATION REQUIRED/);
});

test("prompt-guard stays silent on local coding questions", () => {
  const r = pipe("prompt-guard.mjs", "rename this function and fix the typo in server.mjs");
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), "");
});

test("claim-guard: no ledger → silent pass", () => {
  const r = pipe("claim-guard.mjs", "");
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), "");
});

test("claim-guard warns when edits ran but no test did", () => {
  const tmp = mkdtempSync(join(tmpdir(), "cg-"));
  mkdirSync(join(tmp, "ops", "verify"), { recursive: true });
  writeFileSync(join(tmp, "ops", "verify", "action-log.jsonl"),
    JSON.stringify({ tool: "edit", file_path: "x.ts" }) + "\n");
  const r = spawnSync("node", [join(V, "claim-guard.mjs")], { cwd: tmp, encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /UNVERIFIED-WORK/);
});

test("session-start runs and reports git state", () => {
  const r = spawnSync("node", [join(V, "session-start.mjs")], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /git:|head:/);
});

test("setup.mjs installs into a fresh git repo, idempotent on rerun", () => {
  const tmp = mkdtempSync(join(tmpdir(), "setup-"));
  execFileSync("git", ["init", "-q"], { cwd: tmp });
  const first = spawnSync("node", [join(ROOT, "setup.mjs"), tmp], { encoding: "utf8" });
  assert.equal(first.status, 0, first.stderr);
  for (const p of [".devin/hooks.v1.json", "ops/verify/agent-guard.mjs", "AGENTS.md"])
    assert.ok(existsSync(join(tmp, p)), `missing ${p}`);
  const second = spawnSync("node", [join(ROOT, "setup.mjs"), tmp], { encoding: "utf8" });
  assert.match(second.stdout, /skip/); // nothing clobbered on rerun
});

test("setup.mjs refuses non-git targets", () => {
  const tmp = mkdtempSync(join(tmpdir(), "setup-nogit-"));
  const r = spawnSync("node", [join(ROOT, "setup.mjs"), tmp], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /not a git repo/);
});
