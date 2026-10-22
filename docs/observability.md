# Observability: synthetic checks vs business metrics

The distinction that separates "the server is up" from "the company is
operating". ERP shops care about this distinction more than anything else
in monitoring — a site returning 200 while the nightly settlement produced
zero records is an outage their dashboards won't show.

## The two layers

| | Synthetic check | Business metric |
|---|---|---|
| Question | "Is the system alive?" | "Is work actually flowing?" |
| Probes | `/health` → 200, login page < 1s, canary request completes | vouchers/15min, settlement batch count, payment approval rate, generation success rate |
| Blind spot | Server alive but business stopped (broken queue, dead batch, bad migration) | Needs baseline knowledge — can't alert on a number you never learned |

A mature setup runs **both**, with the business layer carrying the louder
alarm: a synthetic failure wakes someone up; a business-metric collapse
means users are silently failing.

## Business-metric alert shapes

Three patterns cover most real checks:

1. **Zero-floor** — "weekdays 09:00–11:00 normally process ~200 vouchers /
   15 min; today it's 0" → metric below a floor inside its expected window.
   The check must be window-aware or it pages at 3am.
2. **Rate collapse/spike** — payment approval at 10% of the rolling norm,
   refund rate 5× normal, signup count dropped to zero vs the trailing
   7-day band.
3. **False-success** — a batch reports exit 0 but wrote 0 rows
   ("일마감 succeeded, produced nothing"). Count the *output*, never the
   exit code.

## Implementation in this stack

Serverless/Cloudflare version of the Prometheus pattern — no metrics
daemon needed:

- **Metrics live where the work lives.** Order/usage/ledger tables already
  record every unit of work — a `SELECT count(*)` on a time window IS the
  metric. Don't add a metrics pipeline before exhausting that.
- **Sweep, don't stream.** A cron (already running for reconciliation) runs
  the metric queries on a schedule and pages on threshold breach. See
  `ops/verify/business-metrics.example.mjs`.
- **The reconciler is a business-metric engine already.** Ledger invariants
  (Σdeltas == balance), stale-pending recovery, silent-catch audits are
  the same doctrine applied to money.
- **Page the owner, log everything.** Every check writes a row/log; breaches
  go to the loudest channel that exists (SMS > Slack > email). An alert
  channel that can fail silently is itself a gray failure.

## Common mistakes

- Health endpoint that doesn't touch the dependencies it fronts
  (`/health` returns 200 with the DB down — the check lied).
- Canary that uses an admin/test account — "works for us, broken for
  strangers" is the classic gray failure.
- Thresholds with no time-of-day window — zero orders at 4am is normal.
- Counting attempts instead of completions.
