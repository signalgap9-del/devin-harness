// business-metrics.example.mjs — business-metric sweep skeleton.
// Run on a cron alongside reconciliation. Each check queries the table that
// records real work, compares it against a floor/baseline, and pages on
// breach. Synthetic checks ask "is it up"; these ask "is anyone buying."
//
// Wire `query` and `page` to your stack — this file is deliberately
// executable-shaped but transport-agnostic.

const CHECKS = [
  {
    name: "order-flow",
    // The zero-floor pattern: expected volume inside an active window.
    sql: `SELECT count(*) AS n FROM purchase
          WHERE status = 'completed'
            AND created_at > datetime('now', '-15 minutes')`,
    floor: 1,
    window: { utcHours: [1, 15] },          // only scream inside business hours
    severity: "page",
  },
  {
    name: "generation-success-rate",
    // The rate-collapse pattern: compare the last hour to the rolling norm.
    sql: `SELECT
            sum(case when status = 'completed' then 1 else 0 end) * 1.0
              / nullif(count(*), 0) AS rate,
            count(*) AS n
          FROM usage_event
          WHERE created_at > datetime('now', '-1 hour')`,
    // Only judge when there's enough volume to be meaningful — a 0-of-2
    // hour is noise, a 2-of-200 hour is a fire.
    minSample: 20,
    floorRate: 0.8,
    severity: "page",
  },
  {
    name: "signup-telemetry",
    // The is-anyone-arriving check — a dead signup path is invisible to
    // synthetic checks that use an existing account.
    sql: `SELECT count(*) AS n FROM user
          WHERE created_at > datetime('now', '-24 hours')`,
    floor: 1,
    window: null,                           // any hour — a full silent day is bad
    severity: "warn",
  },
];

async function query(sql) {
  // Example: wrangler d1 execute <db> --remote --command="<sql>" --json
  // In prod prefer --file (Windows --command quoting mangles) or a
  // first-party metrics endpoint your app already exposes.
  throw new Error("wire me to your DB/metrics source");
}

async function page(check, detail) {
  // Loudest channel first: SMS > Slack webhook > email. Log regardless.
  console.error(`[biz-metric] ${check.name} breached: ${detail}`);
}

function inWindow(w) {
  if (!w) return true;
  const h = new Date().getUTCHours();
  return h >= w.utcHours[0] && h <= w.utcHours[1];
}

export async function sweep() {
  for (const check of CHECKS) {
    if (!inWindow(check.window)) continue;
    try {
      const row = await query(check.sql);
      if (check.floorRate !== undefined) {
        if ((row.n ?? 0) < (check.minSample ?? 0)) continue; // too thin to judge
        if ((row.rate ?? 0) < check.floorRate)
          await page(check, `rate=${row.rate} n=${row.n} floor=${check.floorRate}`);
      } else if ((row.n ?? 0) < check.floor) {
        await page(check, `count=${row.n ?? 0} floor=${check.floor}`);
      }
    } catch (e) {
      // The check itself failing is also reportable — silently skipping a
      // metric is exactly the gray failure this layer exists to kill.
      await page(check, `check error: ${e?.message ?? e}`);
    }
  }
}
