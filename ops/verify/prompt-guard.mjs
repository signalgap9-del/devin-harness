#!/usr/bin/env node
// prompt-guard.mjs — UserPromptSubmit hook payload.
// Reads the user prompt on stdin; when it smells like an external-knowledge
// question (tools, libraries, companies, "latest", comparisons, API
// behavior), prints an injection that makes source verification
// NON-OPTIONAL for this turn. Deterministic — the requirement is injected
// by code, not left to skill-description goodwill.
//
// Register under your harness's prompt-submit event. If none exists, this
// documents the pattern — the verify-with-sources skill approximates it.
//
// stdout convention (Claude-Code-compatible): JSON
//   { "additionalContext": "<text injected into context>" }
//   or { "decision": "block", "reason": "..." } — unused here.

let prompt = "";
process.stdin.on("data", d => prompt += d).on("end", () => {
  const p = prompt.toLowerCase();
  const EXTERNAL = [
    /latest|current|new version|changelog|deprecat|pricing|cost/,
    /\b(api|sdk|library|framework|tool|model|service|repo|package)\b.{0,40}\b(how|what|which|better|vs|compare|work|use|install|support)/,
    /\b(anthropic|openai|google|aws|cloudflare|meta|microsoft|stripe|paypal|github|gitlab|meta)\b/,
    /does .{0,30}(support|allow|work|exist|offer|have)/,
    /(documentation|docs say|official|recommended way|best practice)/,
  ];
  const hit = EXTERNAL.some(r => r.test(p));

  // Capability questions ("is there a tool for", "how do we do X") route to
  // the catalog BEFORE anything gets hand-rolled — the use-the-stack rule,
  // enforced deterministically so it doesn't depend on skill goodwill.
  const CAPABILITY = [
    /is there (a|an|any|some)?\s*(good\s+|decent\s+|real\s+)?(tool|library|oss|open[- ]source|service|framework|cli|plugin)s? (for|that|to)/,
    /what (tool|library|framework|oss) (should|would|do)/,
    /(build|write|make|create|implement).{0,30}(script|tool|hook|workflow|dashboard|index|monitor|alert)/,
  ];
  const cap = CAPABILITY.some(r => r.test(p));

  // Dense multi-clause short prompts = the misread profile. When a prompt
  // packs 3+ topic fragments into few chars, more than one reading is
  // usually plausible — force a one-line restate before executing. This
  // hook exists because the owner types fast and terse; the literal
  // reading must win over the interesting one.
  const segments = prompt.split(/[,.\n!?]|그럼|그리고|아니/).filter(s => s.trim().length > 4).length;
  const ambig = segments >= 3 && prompt.length < 320;
  if (!hit && !cap && !ambig) process.exit(0);

  const parts = [];
  if (ambig) parts.push(
    "RESTATE-FIRST REQUIRED (injected by prompt-guard hook):",
    "This prompt packs multiple fragments — more than one reading is",
    "plausible. Before doing ANY work: state your interpretation in ONE",
    "line. If two readings diverge materially, ask via ask_user_question",
    "instead of picking the interesting one. Literal > pattern-matched.",
    "");
  if (cap) parts.push(
    "STACK-CHECK REQUIRED (injected by prompt-guard hook):",
    "Before building anything, look up the layer in docs/oss-adoption.md —",
    "prefer READY/OSS entries over hand-rolling. If you write custom code",
    "anyway, it must be the repo-specific residue no OSS covers.",
    "");
  if (hit) parts.push(
    "SOURCE-VERIFICATION REQUIRED (injected by prompt-guard hook):",
    "This question depends on external facts. Before answering:",
    "1. Run at least one web_search.",
    "2. Fetch the primary source (official docs/repo/spec), not a blog summary.",
    "3. Cite what is verified vs inferred vs unverified — do not present",
    "   memory as fact. If sources conflict, say so and show both.",
    "4. If you cannot verify something, say 'unverified beyond X' rather",
    "   than guessing.",
  );
  console.log(JSON.stringify({ additionalContext: parts.join("\n") }));
});
