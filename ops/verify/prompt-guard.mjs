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
  if (!hit) process.exit(0);

  console.log(JSON.stringify({
    additionalContext: [
      "SOURCE-VERIFICATION REQUIRED (injected by prompt-guard hook):",
      "This question depends on external facts. Before answering:",
      "1. Run at least one web_search.",
      "2. Fetch the primary source (official docs/repo/spec), not a blog summary.",
      "3. Cite what is verified vs inferred vs unverified — do not present",
      "   memory as fact. If sources conflict, say so and show both.",
      "4. If you cannot verify something, say 'unverified beyond X' rather",
      "   than guessing.",
    ].join("\n"),
  }));
});
