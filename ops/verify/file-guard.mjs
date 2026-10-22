// file-guard.mjs — PreToolUse hook for edit/write/notebook_edit: the same
// deterministic enforcement as agent-guard.mjs, applied to file mutations
// instead of shell commands. Exit 2 = block, <50ms, no model call.
//
// Universal rules shipped here:
//   - new agent config goes in .devin/, never .claude/ or .cursor/
//   - never write secret-material files (.env, .dev.vars, credentials.json)
//   - never edit applied DB migrations in place — add a new migration
//   - runtime state (logs, .jsonl, .db, browser profiles) is not source
//
// PROJECT RULES: append below. Real examples shipped in production:
//   - copy-surface vocabulary scan (banned marketing slop on landing copy)
//   - "regex-for-intent" ban: natural-language phrase alternations must not
//     route user intent — intent classification belongs in a model call
//   - frozen-surface rules (paused i18n dicts, vendored OSS headers)

let raw = "";
process.stdin.on("data", (d) => (raw += d)).on("end", () => {
  let p = "", incoming = "";
  try {
    const input = JSON.parse(raw)?.tool_input || {};
    p = input.file_path || input.notebook_path || "";
    incoming = String(input.new_string || input.content || "");
  } catch {}
  const block = (reason) => { console.log(JSON.stringify({ decision: "block", reason })); process.exit(2); };
  const f = p.replace(/\\/g, "/").toLowerCase();

  if (/\/\.(claude|cursor|windsurf)\//.test(f))
    block("new agent config goes in .devin/, never .claude/.cursor/ (compatibility-read only)");

  if (/(^|\/)(\.env|\.dev\.vars|.*credentials.*\.json|.*proxies.*\.json|tok\.json)$/.test(f) && !/\.example$/.test(f))
    block("that's a secret-material file — never write/edit it; example templates are fine");

  if (/\/(drizzle|migrations)\/\d{4}_.*\.sql$/.test(f))
    block("applied migrations are immutable — add a new migration file instead");

  if (/\.(log|jsonl|db|sqlite)$/.test(f) || /\/\.chrome-verify\//.test(f))
    block("runtime state is not source — don't hand-edit logs/dbs/profiles");

  /* ── PROJECT RULES GO HERE ── */

  process.exit(0);
});
