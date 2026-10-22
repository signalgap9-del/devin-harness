// agent-ledger.mjs — PostToolUse hook: append every agent action to
// ops/verify/action-log.jsonl. A judge step at deploy time can then read
// the SESSION's behavior — not just the diff it left. Never blocks;
// never logs secret material.
import { appendFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIR = dirname(fileURLToPath(import.meta.url));
mkdirSync(DIR, { recursive: true });
const LOG = join(DIR, "action-log.jsonl");
const SECRET_RE = /(api[_-]?key|secret|token|password|bearer|authorization)/i;

let raw = "";
process.stdin.on("data", (d) => (raw += d)).on("end", () => {
  try {
    const ev = JSON.parse(raw);
    const input = ev.tool_input || {};
    /* summarize — truncate long values, drop anything that smells secret */
    const summary = {};
    for (const [k, v] of Object.entries(input)) {
      if (SECRET_RE.test(k)) { summary[k] = "<redacted>"; continue; }
      const s = typeof v === "string" ? v : JSON.stringify(v);
      if (s && SECRET_RE.test(s)) { summary[k] = "<redacted-body>"; continue; }
      summary[k] = (s || "").slice(0, 300);
    }
    appendFileSync(LOG, JSON.stringify({
      ts: new Date().toISOString(), sid: ev.session_id, pid: ev.prompt_id,
      tool: ev.tool_name, ok: ev.tool_response?.success ?? null, input: summary,
    }) + "\n");
  } catch { /* never break the agent's flow */ }
  process.exit(0);
});
