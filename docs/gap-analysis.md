# Gap analysis — auditing your own stack honestly

A worked example: scoring a real production SaaS (Cloudflare Worker +
D1/KV/R2 + agent-built for months) against the layers this repo documents.
The point is the *method* — run this same table on any stack and the gaps
announce themselves.

## Scorecard format

For each layer: what exists, what's missing, verdict. Verdicts:

- **solid** — works, tested, would survive a model/provider removal
- **thin** — exists but a single failure or a quiet regression slips through
- **gap** — nothing there; you'd find out from a user

## The worked example

| Layer | Exists | Verdict |
|---|---|---|
| Deploy gate | 12 sequential gates (diff scan, schema drift, tsc, tests, build, local boot, route smoke, visual, copy audit) + post-deploy canaries (auth, MCP, judge lanes, error tail) | **solid** — stronger than most teams ship |
| Hook enforcement | PreToolUse exec/file guards + PostToolUse ledger | **solid** |
| Money safety | Idempotent fulfill, cron reconcile, ledger invariants, stale-pending sweep → SMS | **solid** |
| Provider resilience | Multi-lane vision judge (2 providers), loud lane logs, scheduled probes, deploy canary | solid — *after* the outage that taught it |
| Business metrics | Ledger invariants + stale-pending exist; but generation success-rate, signup flow, payment approval rate have **no sweep** | **thin** — money-only coverage |
| Error tracking | Wrangler tail, error_event table | **thin** — no Sentry-class aggregation, no alerting on error-rate spikes, manual tail reading |
| Uptime/synthetic | Post-deploy canaries only | **thin** — nothing probes the live site *between* deploys except the 15-min reconcile's narrow checks |
| Dashboards | none | **gap** — metrics exist as rows; nobody can *see* them |
| Code context for agents | AGENTS.md + ledger; no code graph | **thin** — agent re-derives structure per session |
| Frontend design QA | OSS-derived studio UI; marketing surfaces hand-made | **gap** — no deterministic design check (impeccable `detect` is the candidate) |

## What the example teaches

- The strong layers were all built **after** a burn (deleted_client,
  catalog removal). Proactive layers are the ones still missing —
  dashboards and error-rate alerting exist to catch what no incident has
  taught yet.
- "Thin" is the dangerous verdict: something exists so it *feels* covered,
  but it only covers the last failure's shape.
- The fixes are small precisely because the gates are strong —
  business-metric sweep is a table query + threshold on a cron that
  already exists; error-rate alerting is a count on a table that already
  exists. Thin layers cost hours, not quarters.

## Run it on your stack

1. List the layers (deploy, enforcement, money, providers, metrics,
   errors, uptime, context, design).
2. For each, name the artifact — not the intention. "We'd notice" is not
   an artifact; a probe with a threshold is.
3. Mark solid/thin/gap. If a layer's only evidence is "it hasn't broken
   yet," it's a gap wearing a solid costume.
4. Fix thin/gap cheapest-first: anything whose data already exists as a
   table is a query, not an infra project.
