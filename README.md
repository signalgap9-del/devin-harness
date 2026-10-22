# devin-harness

An agent-harness starter for [Devin](https://devin.ai) CLI / Devin Desktop —
the working setup distilled from running a production multi-tenant SaaS
with autonomous agents for months. Drop it into any repo and the agent
starts with guardrails, memory-shaped rules, and observable deploys instead
of a blank context.

## What's inside

| Piece | Path | What it does |
|---|---|---|
| Repo rules | `AGENTS.example.md` | The doctrine: multi-tenant data rules, gray-failure doctrine, secret registry, deploy-gate rule. Copy to `AGENTS.md` and fill in your project. |
| Exec guard | `ops/verify/agent-guard.mjs` | PreToolUse hook — deterministic regex rules that *block* dangerous shell commands before they run (<50ms, no model call). |
| File guard | `ops/verify/file-guard.mjs` | Same idea for edit/write — blocks secret files, migration edits, runtime-state edits. |
| Action ledger | `ops/verify/agent-ledger.mjs` | PostToolUse hook — appends every tool call (secrets redacted) to `action-log.jsonl` so a judge can review the *session*, not just the diff. |
| Hook wiring | `.devin/config.json` + `hooks.v1.json` | Turns the three guards on for every session in this repo. |
| MCP config | `.devin/mcp_config.example.json` | Example MCP servers (gcloud, browser, provider SDKs) with env-var indirection — never keys in the file. |
| Business metrics | `ops/verify/business-metrics.example.mjs` | Cron-swept checks that ask "is work actually flowing" — zero-floor, rate-collapse, false-success patterns. See `docs/observability.md`. |
| Skills | `.devin/skills/` | Domain skills the agent auto-invokes: SEO, ads-ops, copywriting, landing pages, CRO, ICP, audience research, quality judging. MIT sources in `ATTRIBUTION.md`. |
| Docs | `docs/` | The pattern library: observability, on-call/Slack wiring, security+CI, agent orchestration (Grok↔Devin), OSS stack, Devin feature map. |

## Quickstart

```bash
# 1. copy the harness into your repo
cp -r .devin ops AGENTS.example.md /path/to/your-repo/
cd /path/to/your-repo && mv AGENTS.example.md AGENTS.md

# 2. edit AGENTS.md — fill in your commands and hard rules
# 3. edit .devin/mcp_config.json (from the example) — point at your MCP servers
# 4. add project rules to ops/verify/agent-guard.mjs (marked section)
```

The next session in that repo picks up the hooks automatically —
`PreToolUse` guards block before bad commands run, `PostToolUse` writes the
action ledger.

## The philosophy

- **Rules the agent can violate silently are worse than no rules.** Anything
  important gets a deterministic guard, not a paragraph nobody re-reads.
- **Health = the user's journey, not a status code.** Canary real flows;
  fail-soft must fail loud.
- **Every secret has one name and one home.** A registry of names (never
  values) beats hunting env vars across three machines.
- **OSS first.** Don't hand-roll what a maintained library does better —
  the skills dir itself is vendored MIT work with attribution.

## Layout

```
.devin/
  config.json              hooks wiring (hook events → guard scripts)
  hooks.v1.json            same wiring, hooks.v1 schema
  mcp_config.example.json  MCP server template
  skills/                  agent skills (auto-invoked by task match)
ops/verify/
  agent-guard.mjs              pre-exec command rules
  file-guard.mjs               pre-edit file rules
  agent-ledger.mjs             post-tool action log
  business-metrics.example.mjs business-metric sweep skeleton
docs/
  devin-features.md        Devin capability map (memory, oncall, playbooks…)
  patterns.md              gray failures, fail-loud, canaries, SPOF policy
  observability.md         synthetic checks vs business metrics
  oncall-and-slack.md      Devin Oncall setup + Slack triggers/automations
  security-and-ci.md       scanners in the gate + the gate pipeline itself
  agent-orchestration.md   Grok Bot → Devin, crosswalk, Composio paths
  oss-stack.md             curated OSS per layer (impeccable, gitleaks…)
```

MIT — take what fits, leave what doesn't.
