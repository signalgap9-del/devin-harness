#!/usr/bin/env node
// devin-session.mjs — open a Devin session. This is THE call the
// dispatcher (Grokbot, cron, GH Actions repository_dispatch) makes.
//   DEVIN_API_KEY=... node ops/dispatch/devin-session.mjs "<prompt>"
//
// API: POST https://api.devin.ai/v1/sessions  { prompt, ... }
// Verify the current endpoint/shape against api.devin.ai/docs before
// wiring to prod — the API surface moves. Env-var key only, never args.

const [,, prompt, ...flags] = process.argv;
if (!prompt) {
  console.error("usage: node devin-session.mjs \"<prompt>\" [--tags=a,b] [--wait]");
  process.exit(1);
}
const KEY = process.env.DEVIN_API_KEY;
if (!KEY) { console.error("DEVIN_API_KEY env required — service-account key, never committed"); process.exit(1); }

const tags = (flags.join(" ").match(/--tags=(\S+)/)?.[1] || "").split(",").filter(Boolean);

const res = await fetch("https://api.devin.ai/v1/sessions", {
  method: "POST",
  headers: { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ prompt, ...(tags.length ? { tags } : {}) }),
});

if (!res.ok) {
  console.error(`session create failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const body = await res.json();
// Expected shape: { session_id, url } — print both for the dispatcher log.
console.log(JSON.stringify({ session_id: body.session_id ?? body.id, url: body.url }, null, 0));
