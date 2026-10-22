# The monitoring stack — what "standard" actually is

How real teams manage production visibility, mapped to a serverless
(Cloudflare Worker) reality. The industry answer is boring and cheap —
that's the point.

## The minimum viable set (small-team canon)

| Question | Tool | Cost |
|---|---|---|
| Did something throw? | **Sentry** — error grouping, release tracking, source maps; Workers SDK exists | free tier ~5k errors/mo |
| Is it up *right now*? | **Better Stack** / UptimeRobot / Grafana synthetic — external probes between deploys, status page | free–$10/mo |
| Is work flowing? | **Business metrics sweep** — `ops/verify/business-metrics.example.mjs` on the existing cron | $0 — queries your own tables |
| Metrics/logs/traces at scale | **Grafana Cloud free tier** (Prometheus remote-write + Loki + Tempo) via OpenTelemetry | free tier: 10k series / 50GB |
| What's slow / what's used | **PostHog** — product analytics + replay + flags + a secondary error sink | ~1M events free |

Under ~$200/mo total; the free tiers genuinely cover a small SaaS. The
composition matters more than the vendor list — errors, uptime, business
flow, and aggregated telemetry are four different questions.

## Mapping onto this stack

- **Errors**: Sentry SDK in the Worker (it supports workers runtime) +
  keep the `error_event` table — Sentry is the lens, the table is the
  record.
- **Uptime between deploys**: external probe hitting the *user journey*
  endpoints every 1–5 min — not `/health`, a real auth/gen surface. This
  closes the gap where canaries only fire at deploy time.
- **Business metrics**: the reconcile cron already sweeps money
  invariants — extend it to generation success-rate and signup-flow counts
  (the `example.mjs` checks). Data already exists; it's a query, not an
  infra project.
- **Logs**: structured JSON lines with a `request_id`/`user_id` field are
  the prerequisite — wrangler tail is for live debugging, not a strategy.
  If you outgrow it: Loki via Grafana Cloud.
- **Alert routing**: two channels minimum (SMS + Slack webhook), and log
  *each channel's* send failure — the alert path itself is a gray-failure
  candidate (a dead SMS provider that silently falls back is how pages
  get missed).

## Alert hygiene — the part that kills setups

- Page only on action-required; anything else is a report, not an alert.
  Alert fatigue kills monitoring faster than no monitoring.
- Every check must fail loud: a sweep that errors without reporting is a
  blind spot with a dashboard.
- Window-awareness on volume checks — zero orders at 4am is not a fire.

## CI/CD stack management

Same doctrine as the deploy gate already implements:

- One pipeline owns the deploy command; CI mirrors it as a required check.
- Every step fails closed *with a timeout* — a hung check fails, never
  parks.
- Post-deploy canaries verify the user journey on the live domain, not
  the uploader's exit code.
- Releases tagged so Sentry release-tracking ties an error spike to the
  deploy that caused it — that's the loop closing between CI and
  monitoring.
