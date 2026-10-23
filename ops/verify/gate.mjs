// gate.mjs — deterministic quality gate. The part of review that doesn't judge.
//   node ops/verify/gate.mjs [--base https://yoursite.com] [--no-diff]
//
// 1. Diff scan: forbidden suppressions / secrets added vs HEAD.
// 2. Route smoke: each route must return 200 and contain its SSR marker —
//    proves the page rendered, not just that HTTP answered. PROJECT: fill
//    ROUTES with your real paths + marker substrings.
// Exit 1 on any failure; JSON report on stdout.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const args = process.argv.slice(2);
const BASE = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://localhost:3000";
const SKIP_DIFF = args.includes("--no-diff");

// route → marker substring that proves the page rendered. PROJECT: fill.
const ROUTES = [
  // ["/", "YourAppName"],
  // ["/pricing", "per month"],
];

const FORBIDDEN = [
  [/^\+.*@ts-ignore/, "@ts-ignore added"],
  [/^\+.*@ts-expect-error/, "@ts-expect-error added"],
  [/^\+.*eslint-disable/, "eslint-disable added"],
  [/^\+.*\b(it|describe|test)\.skip\(|^\+.*\bx(it|describe)\(/, "skipped test added"],
  [/^\+.*(api[_-]?key|secret|token|password)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}/i, "possible secret added"],
];

const report = { base: BASE, ts: new Date().toISOString(), diff: [], routes: [], ok: true };
const fail = (kind, what) => { report.ok = false; report[kind].push(what); };

if (!SKIP_DIFF) {
  let diff = "";
  try { diff = execFileSync("git", ["diff", "HEAD", "--unified=0"], { cwd: ROOT, encoding: "utf8" }); } catch {}
  for (const line of diff.split("\n"))
    for (const [re, msg] of FORBIDDEN)
      if (re.test(line)) { fail("diff", `${msg}: ${line.trim().slice(0, 120)}`); break; }
}

for (const [path, marker] of ROUTES) {
  try {
    const r = await fetch(BASE + path, { signal: AbortSignal.timeout(15000), redirect: "follow" });
    const body = await r.text();
    if (r.status !== 200) fail("routes", `${path}: HTTP ${r.status}`);
    else if (marker && !body.includes(marker)) fail("routes", `${path}: 200 but missing marker "${marker}"`);
  } catch (e) { fail("routes", `${path}: ${String(e).slice(0, 120)}`); }
}

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.ok ? 0 : 1;
