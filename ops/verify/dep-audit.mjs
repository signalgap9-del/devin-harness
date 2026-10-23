// dep-audit.mjs — open-source quality gate for NEW dependencies in a diff.
//
//   node ops/verify/dep-audit.mjs [--base-ref origin/main]
//
// Deterministic, not a model judgment: for every dependency a diff ADDS to
// any package.json, check public truth before it ships —
//   registry.npmjs.org  → version publish date, package age, deprecated flag
//   api.npmjs.org       → last-week downloads (traction)
//   api.osv.dev         → known vulnerabilities for the resolved version
//
// Blocking rules (CONSTRAINTS/AGENTS policy):
//   too_fresh    — resolved version published < 7 days ago (supply-chain window)
//   known_vuln   — OSV reports a vulnerability for that version
//   deprecated   — registry marks the version deprecated
//   suspect      — package < 90 days old AND < 500 weekly downloads
// Warn-only:
//   low_traction — < 100 weekly downloads on a package older than 90 days
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf("--" + n); return i > -1 ? args[i + 1] : null; };
const DAY = 864e5;

/* added deps from a package.json diff — "+  "name": "spec"" lines */
export const addedDeps = (diff) => {
  const out = [];
  let file = null, inDeps = false, depth = 0;
  for (const line of diff.split("\n")) {
    const h = line.match(/^diff --git a\/(\S+)/);
    if (h) { file = h[1]; inDeps = false; continue; }
    if (!file?.endsWith("package.json")) continue;
    /* only parse entries INSIDE a dependencies block — script entries like
       "deploy": "node ..." are not deps and resolve to unrelated packages */
    const ctx = line.replace(/^[+-]?/, "");
    if (/"(dev|peer|optional)?[dD]ependencies"\s*:\s*\{/.test(ctx)) { inDeps = true; depth = 1; continue; }
    if (inDeps) {
      depth += (ctx.match(/\{/g) || []).length - (ctx.match(/\}/g) || []).length;
      if (depth <= 0) { inDeps = false; continue; }
      const add = line.match(/^\+\s+"([^"\s]+)"\s*:\s*"([^"]+)"/);
      if (add) out.push({ file, name: add[1], spec: add[2] });
    }
  }
  return out;
};

const getJson = async (url, init) => {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
  return r.ok ? r.json() : null;
};

export const auditDep = async (name, spec) => {
  const d = { name, spec, checks: [], severity: "ok" };
  const meta = await getJson(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
  if (!meta) { d.checks.push("registry_miss"); d.severity = "warn"; return d; }

  /* resolve spec → a concrete version to date-check */
  const clean = spec.replace(/^[\^~>=\s]+/, "");
  const ver = meta.versions?.[clean] ? clean : meta["dist-tags"]?.latest;
  const pubAt = meta.time?.[ver] ? Date.parse(meta.time[ver]) : null;
  const created = meta.time?.created ? Date.parse(meta.time.created) : null;
  d.resolved = ver; d.publishedAt = pubAt ? new Date(pubAt).toISOString() : null;

  const dep = meta.versions?.[ver]?.deprecated;
  if (dep) { d.checks.push("deprecated: " + String(dep).slice(0, 80)); d.severity = "block"; }
  if (pubAt && Date.now() - pubAt < 7 * DAY) { d.checks.push(`too_fresh: published ${Math.round((Date.now() - pubAt) / DAY)}d ago`); d.severity = "block"; }

  const dl = await getJson(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`);
  d.weeklyDownloads = dl?.downloads ?? null;
  if (created && Date.now() - created < 90 * DAY && (dl?.downloads ?? 0) < 500) {
    d.checks.push(`suspect: package ${Math.round((Date.now() - created) / DAY)}d old, ${dl?.downloads ?? 0} dl/wk`);
    d.severity = "block";
  } else if ((dl?.downloads ?? 0) < 100 && d.severity === "ok") {
    d.checks.push(`low_traction: ${dl?.downloads ?? 0} dl/wk`);
    d.severity = "warn";
  }

  if (ver) {
    const osv = await getJson("https://api.osv.dev/v1/query", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ package: { name, ecosystem: "npm" }, version: ver }),
    });
    if (osv?.vulns?.length) { d.checks.push(`known_vuln: ${osv.vulns.length} OSV finding(s) — ${osv.vulns[0].id}`); d.severity = "block"; }
  }
  return d;
};

export const auditDiff = async (diff) => {
  const deps = addedDeps(diff);
  const results = await Promise.all(deps.map((d) => auditDep(d.name, d.spec).catch((e) => ({ ...d, checks: ["audit_error: " + e.message], severity: "warn" }))));
  return {
    deps: results,
    blocking: results.filter((r) => r.severity === "block").map((r) => ({ file: r.file, name: r.name, spec: r.spec, resolved: r.resolved, checks: r.checks })),
    warnings: results.filter((r) => r.severity === "warn"),
  };
};

/* CLI */
const IS_CLI = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (IS_CLI) {
  const diff = opt("diff")
    ? readFileSync(opt("diff"), "utf8")
    : execFileSync("git", ["diff", opt("base-ref") ? opt("base-ref") + "...HEAD" : "HEAD", "--", "**/package.json", "package.json"], { cwd: ROOT, encoding: "utf8", shell: false });
  const r = await auditDiff(diff);
  console.log(JSON.stringify({ ok: r.blocking.length === 0, ...r }, null, 2));
  process.exitCode = r.blocking.length ? 1 : 0;
}
