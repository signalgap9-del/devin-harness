// predeploy.example.mjs — pre-deploy gate SKELETON. Rename to predeploy.mjs,
// fill in your build/serve steps, and wire it as the deploy entry:
//   package.json: "deploy": "node ops/verify/predeploy.mjs && <your deploy cmd>"
// The gate runs INSIDE deploy — a bare `wrangler deploy`/`vercel` bypass
// becomes impossible, not just discouraged.
//
// Universal lessons baked in (each was a real incident):
//   - Deploy lock: two concurrent deploys wipe each other's build dir —
//     the failure looks like a code bug and burns an hour.
//   - NODE_OPTIONS floor: a small inherited --max-old-space-size OOMs big
//     SSR builds. Raise, never lower.
//   - Any spawned dev server must die on ANY exit or it locks build output.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DIR = fileURLToPath(new URL(".", import.meta.url));
const ROOT = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/* 0. Deploy lock — stale locks self-clear after TTL (a crashed run must not
   lock out the next one forever). */
const LOCK = DIR + "deploy.lock";
const TTL = 30 * 60e3;
if (existsSync(LOCK) && Date.now() - Number(readFileSync(LOCK, "utf8") || 0) < TTL) {
  console.error("GATE FAIL — another deploy holds the lock (deploy.lock). If stale, delete it.");
  process.exit(1);
}
try { mkdirSync(DIR, { recursive: true }); writeFileSync(LOCK, String(Date.now()), { flag: "wx" }); } catch {}
const cleanup = () => { try { rmSync(LOCK); } catch {} };
process.on("exit", cleanup); process.on("SIGINT", () => process.exit(130));

const step = (n, s) => console.log(`\n[g ${n}] ${s}`);
const run = (cmd, a, opts = {}) => {
  const r = spawnSync(cmd, a, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32", ...opts });
  if (r.status !== 0) fail(`${cmd} ${a.join(" ")} exited ${r.status}`);
};
const fail = (s) => { cleanup(); console.error(`\nGATE FAIL — ${s}`); process.exit(1); };

/* 1. deterministic diff scan (suppressions/secrets/route smoke markers) */
step(1, "deterministic gate"); run("node", [DIR + "gate.mjs", "--no-routes"]);

/* 2. typed judgment — advisory without TYPESAFE_API_KEY, never blocks blind */
step(2, "jev gate"); run("node", [DIR + "jev-gate.mjs"]);

/* 3. typecheck */
// step(3, "typecheck"); run("npx", ["tsc", "--noEmit"]);

/* 4. build — PROJECT: your build command. Remember: many deploy CLIs do NOT
   rebuild; build first or the gate verified nothing. */
// step(4, "build"); run("npm", ["run", "build"]);

/* 5. local smoke — boot the REAL built artifact, probe a route for an SSR
   marker (HTTP 200 alone proves nothing), kill the server on exit. */
// step(5, "local smoke"); /* spawn server → fetch localhost → assert marker → kill */

/* 6. copy/policy audit on public surfaces — deterministic regexes, no model */
// step(6, "copy audit"); run("node", [DIR + "copy-audit.mjs"]);

step("✓", "all gates passed — proceed to deploy command");
cleanup();
