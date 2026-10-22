#!/usr/bin/env node
// claim-guard.mjs — Stop-hook payload.
// When the agent tries to end the turn, checks the action ledger for
// evidence that the work was actually verified (tests/build/typecheck ran
// THIS session). Prints an advisory when a "done" claim would go out
// without evidence. Advisory, not block — the point is making unverified
// claims LOUD, not pretending enforcement exists where the harness
// can't block.
//
// Register under your harness's Stop / turn-end event. If none exists,
// run it manually before claiming done — same information.

import { readFileSync, existsSync } from "node:fs";

const LEDGER = "ops/verify/action-log.jsonl";
if (!existsSync(LEDGER)) process.exit(0);

const lines = readFileSync(LEDGER, "utf8").trim().split("\n")
  .map(l => { try { return JSON.parse(l); } catch { return null; } })
  .filter(Boolean);

// Did any edit/write happen this session?
const edits = lines.filter(e => /write|edit/i.test(e.tool ?? e.t ?? ""));
if (!edits.length) process.exit(0); // read-only session — nothing to verify

// Did any verification command run after the last edit?
const lastEdit = lines.lastIndexOf(edits[edits.length - 1]);
const after = lines.slice(lastEdit + 1);
const VERIFY_RE = /(npm (test|run check|run typecheck)|tsc|pytest|vitest|jest|cargo test|go test|dotnet test|predeploy|deploy)/i;
const verified = after.some(e => VERIFY_RE.test(e.command ?? e.cmd ?? e.input ?? ""));

if (!verified) {
  console.log(JSON.stringify({
    additionalContext: [
      "UNVERIFIED-WORK WARNING (claim-guard): file edits happened this",
      "session but no test/build/typecheck ran after the last edit.",
      "Either run the verification now, or state explicitly",
      "'unverified — tests not run' instead of claiming done.",
    ].join("\n"),
  }));
}
