# Production engineering stack catalog — 24 verified entries

The stockpile. Every entry: what it is, when it pays, our current status,
and the ERP-company translation (batch-job shops think in jobs/ledger/
audit, not "microservices"). Sources verified Oct 2026 via official repos
and docs — licenses/maintenance status noted where it changed recently.

## Layer 1 — source control & merge (the "Scion as OSS" answers)

| # | Tool | What it is | Adopt when | ERP translation |
|---|---|---|---|---|
| 1 | **Sapling** (`facebook/sapling`) | Meta's git-compatible VCS built for million-file repos; `sl` client + Mononoke server + ISL web UI. The actual open-source Scion analog | repo or commit volume breaks git tooling; adoptable solo — clones/pushes GitHub | mainframe-scale monorepo discipline |
| 2 | **jj / Jujutsu** (`jj-vcs/jj`) | working-copy-as-commit VCS, git-backend so repos still push to GitHub; `jj undo` everything; conflict objects commit without blocking | want fearless history editing; solo-adoptable TODAY — colleagues see normal commits | — |
| 3 | **Gerrit** | review surface + submit-requirements engine, the Antique analog | review volume outgrows PR UI; also the pattern: review = data, not a web page | audit-grade review trail |
| 4 | **GitHub merge queue** / **Mergify** / Bors-NG lineage | serialized landing — each merge gates the *cumulative* result, not the branch tip. Solves our "session A's diff judged without B" gap | two+ agents/devs landing same-day | change-window serialization |
| 5 | **Stacked diffs**: `ghstack`, `spr`, Graphite CLI | big change = chain of small reviewable commits | agent output too big to review as one diff | — |
| 6 | **jev-review dashboard** | local review surface for typed-judgment verdicts — poor man's Antique | before parallel sessions become routine | review evidence a human can audit |

## Layer 2 — CI/CD & progressive delivery

| # | Tool | What it is | Adopt when | ERP translation |
|---|---|---|---|---|
| 7 | **Argo Rollouts** / **Flagger** | progressive delivery: canary/blue-green + metric-gated auto-promote/rollback (PromQL thresholds) | K8s; for Workers, `wrangler versions` + traffic % is the same primitive, free | staged release to subset of plants |
| 8 | **ArgoCD / Flux** | GitOps: repo state IS cluster state, drift auto-corrected | infra declarative enough to reconcile | configuration-as-source-of-truth |
| 9 | **Temporal** | durable workflow execution — deploy pipelines as resumable code | our gate chain needs retry/resume semantics | batch-job orchestration (the ERP-shaped tool) |
| 10 | **Dagger** / Earthly | programmable CI in containers — same pipeline local & CI | gate logic outgrows shell scripts | — |
| 11 | **Bazel / Nx / Turborepo** | build graph + remote cache for monorepos | build time > ~5min or multi-package churn | — |
| 12 | **Pact** (+ Pact Broker / Swagger bi-directional) | consumer-driven contract tests between services | provider APIs we don't control drift (WaveSpeed/DashScope catalog) | interface regression vs partner systems |

## Layer 3 — observability & alerting

| # | Tool | What it is | Adopt when | ERP translation |
|---|---|---|---|---|
| 13 | **Prometheus + Alertmanager** | metrics + dedup/group/inhibit routing, config = one YAML in git | the reference impl; our metrics are DB rows — bridge via a metrics endpoint | **the** ERP standard |
| 14 | **Grafana Cloud** (Mimir/Loki/Tempo) + OTel | dashboards/logs/traces, free tier covers small scale | now — instrument first, vendor later | dashboards ops teams live in |
| 15 | **Sentry** (Workers SDK) | error grouping + release correlation | now — wrangler tail isn't triage | exception monitoring |
| 16 | **Keep** (12k★) | OSS AIOps: multi-source alert dedup/correlation/enrichment + workflow automation | alert sources > 2 | alert flood control — the actual ERP pain |
| 17 | **Better Stack / UptimeRobot** | external uptime probes | now — deploy-time canaries leave gaps between deploys | — |

## Layer 4 — on-call & incident

| # | Tool | What it is | Adopt when | ERP translation |
|---|---|---|---|---|
| 18 | **GoAlert** / **IncidentRelay** | self-hosted paging: schedules, escalation, ack | solo→small team needing real paging beyond one SMS | on-call rotation software |
| 19 | ⚠️ **Grafana OnCall OSS** | DO NOT ADOPT — maintenance mode, archived Mar 2026, push-relay dies with it | use Grafana Cloud IRM or GoAlert instead | — |
| 20 | **incident.io / Rootly / FireHydrant** (SaaS) | incident coordination: channel spawn, commander/scribe, timeline, statuspage | sev1s become routine enough to need coordination | ITSM integration layer |
| 21 | **Devin Oncall** | responders/incidents/reports on top of your telemetry | after Sentry+probes exist (it needs signal input) | automated first-response |

## Layer 5 — flags, secrets, quality gates

| # | Tool | What it is | Adopt when | ERP translation |
|---|---|---|---|---|
| 22 | **Unleash** (default) / **Flagsmith** (multi-org) / **OpenFeature** (vendor-neutral SDK spec) / **GrowthBook** (real A/B stats) | feature-flag servers | KV kill-switches ARE flags already — adopt a server when flags need targeting/segments | feature toggles per tenant/site |
| 23 | **Infisical** | secrets mgmt + rotation + leak prevention + **Agent Vault** — brokers AI-agent credential access so agents never hold raw keys (proxy injects). Directly answers our egress/secrets gap | before agents get more API surface | credential vaulting, audit log |
| 24 | **SOPS + age** | encrypted secrets in git, GitOps-style | secrets must live in repo safely | — |

## The ERP interview mapping

Their world → ours: batch-job health = our business-metric sweep
(reconcile cron). Alert fatigue = Alertmanager/Keep. Change advisory
board = our deploy gate (automated CAB). Ledger invariants = their audit
requirement — we literally enforce `Σdelta == balance`. Oncall rotation =
GoAlert/IncidentRelay patterns. Every item above has a same-shaped ERP
cousin — speak jobs, ledgers, and audit trails, not deploys and canaries.

## Adoption rule (unchanged)

Triggers, not fashion: each row says when. The catalog exists so the
answer to "how do people solve X" is a lookup, not a research session.
