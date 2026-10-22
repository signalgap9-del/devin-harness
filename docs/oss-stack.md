# The OSS stack

Curated tools that this harness assumes or recommends — all free/OSS,
picked because they cover a layer a prompt can't.

## Agent-side skills

| Tool | Layer | Install |
|---|---|---|
| **impeccable** (pbakaus, Apache-2.0, ~84k★) | Frontend design quality — 24 commands (`/impeccable audit`, `polish`, `critique`…) + 61 deterministic anti-pattern detector rules that run with no LLM | `npx impeccable install` (detects your harness), then `/impeccable init` in the project |
| Devin built-in skills | Task-matched workflows (`security-and-hardening`, `debugging-and-error-recovery`, `spec-driven-development`…) | already present in the user-level skills dir |
| The skills in `.devin/skills/` here | Domain ops — SEO, ads, copy, CRO, ICP, quality judging | copy the dir; MIT attributions in `ATTRIBUTION.md` |

`npx impeccable detect src/` doubles as a CI gate step (JSON output mode:
`--json`) — design quality as a deterministic check, not a vibe.

## Security scanners for the gate

| Tool | Catches |
|---|---|
| `gitleaks` | committed secrets — deeper than a regex |
| `osv-scanner` / `npm audit` | dependency CVEs |
| `semgrep` | SAST rules (authz, injection shapes) |
| This repo's diff scan | `@ts-ignore`, skipped tests, secret-shaped literals |

## Observability (serverless edition)

| Tool | Role |
|---|---|
| `ops/verify/business-metrics.example.mjs` | business-metric sweep skeleton — zero-floor / rate-collapse / false-success checks on cron |
| Provider canaries | post-deploy probes of the real user journey |
| Wrangler tail / error tail | log truth during deploy |

If you outgrow it: Prometheus/Grafana or Datadog for real metrics infra —
the doctrine in `observability.md` transfers unchanged.

## Agent orchestration

| Tool | Role |
|---|---|
| grokbot.dev templates (e.g. "Devin Manager") | Grok Bot opens/watches/steers Devin sessions from chat |
| crosswalk.to | MCP message bus for agent↔agent task handoff |
| Composio Devin MCP | managed OAuth + 1,500 integrations + audit trail |
| Devin API | programmatic session control without a middle bot |

## Rule

Use the maintained tool; hand-roll only what it can't do. Every entry here
replaces a week of custom code — the harness's job is gluing them under one
set of rules, not reimplementing them.
