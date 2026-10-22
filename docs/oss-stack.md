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

## Workflow packs

| Tool | Layer | Note |
|---|---|---|
| **pstack** (Lauren Tan / @poteto) | Cursor plugin: `poteto-mode` router → 10 workflow skills (how, why, architect, arena, unslop, interrogate, automate-me, reflect, tdd) + 17 first-principles skills | The "1,000 PRs/month" workflow. Its router exists because Cursor has no auto-invocation — Devin skills self-select, so port the *workflows* (verification depth, arena's multi-model challenge), not the router |
| **open-pstack** (ericlitman, MIT) | Claude Code / Codex port of pstack, tracks upstream | Use this if the main harness isn't Cursor |
| cursor/plugins (official) | continual-learning (AGENTS.md memory updates), thermos (deep branch review), cli-for-agent (agent-safe CLI design), cursor-team-kit | Plugin specs worth mining for patterns even without Cursor |

What pstack adds that a skills dir alone doesn't: **verification discipline
as a workflow** — learn the system before changing it, run the real behavior
not just tests, arena-challenge important decisions across models. Pair it
with deterministic enforcement (our hooks) — pstack shapes the agent's
judgment; hooks make sure judgment lapses can't execute.

## Code context

| Tool | Layer | Note |
|---|---|---|
| **graphify** (Apache-2.0) | Local code knowledge graph — tree-sitter AST → queryable graph, `file:line` citations, edges tagged EXTRACTED/INFERRED, `graph.html` visual map | The anti-grep layer: agent queries structure instead of re-reading the repo. `uv tool install graphifyy` + `graphify install` + AGENTS.md rules. See `context-engineering.md` |
| Devin Memory | personal cross-session corrections | repo rules are shared truth; memory is learned truth |

## Agent orchestration

## Rule

Use the maintained tool; hand-roll only what it can't do. Every entry here
replaces a week of custom code — the harness's job is gluing them under one
set of rules, not reimplementing them.
