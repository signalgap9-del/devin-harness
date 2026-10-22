// agent-guard.mjs — PreToolUse hook: deterministic rule enforcement.
// Runs before every exec call: hard rules, no model call, <50ms.
// Exit 2 = block the action. The agent sees the `reason` and must adjust.
//
// Universal rules shipped here:
//   - never update git config
//   - no destructive ops (git force/reset/clean, rm -rf) without confirmation
//   - no secrets printed or committed
//   - no package publishing (irreversible, public)
//   - no cloud identity/billing destruction (gcloud/bq/gsutil)
//   - agent config goes in .devin/, never .claude/ or .cursor/
//   - no signup/account automation
//
// PROJECT RULES: append your own below — the pattern is a regex on the
// lowercased command plus a block() call with the reason. Real examples
// (from a Cloudflare SaaS): block `wrangler d1 execute --remote` writes to
// auth/billing tables, block `wrangler secret put/delete` mutations, block
// SQL piped via --command on Windows (quoting mangles — --file only).

let raw = "";
process.stdin.on("data", (d) => (raw += d)).on("end", () => {
  let cmd = "";
  try { cmd = JSON.parse(raw)?.tool_input?.command || ""; } catch {
    // Fail-closed: a payload we can't parse is a command we can't inspect.
    console.log(JSON.stringify({ decision: "block", reason: "unparseable tool_input — guard refuses to inspect what it can't read" }));
    process.exit(2);
  }
  const block = (reason) => { console.log(JSON.stringify({ decision: "block", reason })); process.exit(2); };
  const c = cmd.toLowerCase();

  /* git config — hard rule: agent never mutates repo identity/remotes */
  if (/\bgit\s+config\b/.test(c)) block("never update git config");

  /* destructive git — history rewrite / discarded work */
  if (/\bgit\s+push\b.*\s(-f|--force|\+)\b/.test(c) || /\bpush\s+--force\b/.test(c))
    block("force-push rewrites remote history — needs explicit owner confirmation for that specific action");
  if (/\bgit\s+reset\s+--hard\b/.test(c) || /\bgit\s+clean\s+-f/.test(c))
    block("destructive git op discards uncommitted work — confirm with the owner first");
  if (/\bgit\s+checkout\s+(--\s+)?\./.test(c) || /\bgit\s+checkout\s+--\s/.test(c))
    block("checkout over uncommitted changes discards work — confirm with the owner first");
  if (/\bgit\s+branch\s+-D\b/.test(c))
    block("branch deletion — confirm with the owner first");

  /* filesystem destruction */
  if (/\brm\s+-rf?\b/.test(c) || /\brmdir\s+\/s\b/.test(c) || /\bdel\s+\/[fs]/.test(c))
    block("destructive filesystem op — confirm with the owner first");

  /* secrets — never print or commit them */
  if (/\b(cat|type|echo|printenv|env)\b.*(api_key|secret|token|password|\.env\b)/.test(c) && !/\.env\.example/.test(c))
    block("command would expose secret material — read .env via a loader, never echo it");

  /* cloud identity/project destruction — burned lesson: a deleted project
     took the production OAuth client down with it (401 deleted_client,
     sign-in dead). Owner-only ops. Undelete/restore is always allowed —
     that IS the fix path. */
  if (/\b(gcloud|gsutil|bq)\b/.test(c)) {
    if (/\bprojects\s+delete\b/.test(c) || /\bbilling\s+projects\s+unlink\b/.test(c))
      block("project delete / billing-unlink destroys OAuth clients, VMs, keys — owner-only, never agent-initiated");
    if (/\bservice-accounts\s+(delete|disable)\b/.test(c) || /\b(?:iam[ -].*)?keys\s+delete\b/.test(c))
      block("SA delete/disable or key delete can break production auth — owner sign-off required");
    if (/\boauth-clients?\s+delete\b/.test(c) || /\bapi-keys\s+delete\b/.test(c) || /\bsecrets\s+(delete|destroy)\b/.test(c) || /\bkeys?\s+destroy\b/.test(c))
      block("deleting an OAuth client / API key / secret / KMS key can kill sign-in or crypto — owner sign-off required");
    if (/\bservices\s+disable\b/.test(c) || /\bremove-iam-policy-binding\b/.test(c))
      block("disabling an API or removing IAM roles can break production — owner sign-off required");
    if (/\bcompute\s+instances\s+(delete|stop|reset)\b/.test(c) || /\bbuckets?\s+(delete|rm|rb)\b/.test(c) || /\bgsutil\s+(rm|rb)\b/.test(c) || /\bbq\s+(rm|mk\s+--delete)\b/.test(c) || /\brm\s+-r?\b.*gs:\/\//.test(c))
      block("destroying VMs/buckets/datasets/objects is irreversible — owner sign-off required");
  }

  /* account automation — creating real accounts is an external side effect;
     use a dedicated test account instead */
  if (/sign[_-]?up|\/auth\/sign-up/.test(c) && /curl|fetch|node|python|wget/.test(c))
    block("no signup automation — use a test account or manual login");

  /* package publishing / external posts are real-world side effects */
  if (/\b(npm|pnpm)\s+publish\b/.test(c))
    block("package publish is irreversible and public — confirm with the owner first");

  /* config placement — .devin/ only; other tool dirs are read-compat only */
  if (/\.claude\//.test(c) && /(>|>>|\bwrite\b|\btouch\b|\bmkdir\b|\bcp\b|\bcopy\b)/.test(c))
    block("new config goes in .devin/, never .claude/ (compatibility-read only)");

  /* ── PROJECT RULES GO HERE ────────────────────────────────────────────
     Example (remote DB guard): refuse writes to identity/ledger tables
     unless the SQL was supplied via a file the guard could scan —
     fail-closed on anything it cannot inspect. */

  process.exit(0);
});
