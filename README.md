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
| Skills | `.devin/skills/` | Domain skills the agent auto-invokes: SEO, ads-ops, copywriting, landing pages, CRO, ICP, audience research, quality judging, **verify-with-sources** (forced primary-source research). MIT sources in `ATTRIBUTION.md`. |
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
  monitoring-stack.md      the standard small-team stack mapped to serverless
  context-engineering.md   the works-without-hand-feeding stack (AGENTS→graph)
  gap-analysis.md          auditing your own stack honestly (worked example)
  oncall-and-slack.md      Devin Oncall setup + Slack triggers/automations
  security-and-ci.md       scanners in the gate + the gate pipeline itself
  agent-orchestration.md   Grok Bot → Devin, crosswalk, Composio paths
  grokbot-architecture.md  Grok Bot anatomy + the three integration paths
  lab-stacks.md            how Anthropic (Scion, auto-mode) & OpenAI (Codex
                           harness/App Server) actually build — Oct 2026
  decision-models.md       typed-judgment layer (Jev, Decision API) + how
                           the gate uses it
  release-engineering.md   deploy stack vs production baseline — Scion
                           question, parallel-agent risks, gap list
  testing-strategy.md      what tests prove vs what typed judgment proves;
                           taxonomy + conventions for agent-written code
  oncall-playbooks.md      runbook/incident framework + where Devin Oncall,
                           Grokbot, cron sweeps each plug in
  harness-vs-labs.md       honest diff vs Anthropic/OpenAI published
                           structure — gaps, fixes, adoption path
  production-stack-catalog.md  24 verified production frameworks/tools
                           across 5 layers + ERP-company translation
  agent-memory.md          MemT/procedural-memory verdict: adopt the
                           experience-bank pattern, skip the model
  claude-code-feature-map.md  full feature sweep of the reference harness
                           + official anthropic repos + our gaps
  adopting-large-oss.md    can this harness ship Odoo-scale OSS to prod?
                           (yes — and exactly what it takes)
  production-readiness-model.md  control vs data plane, coverage matrix,
                           the real remaining 10% + ERP playbook example
  production-methodologies.md    TBD/GitHub flow/Gitflow, env promotion,
                           change mgmt, release trains — all URLs
  release-orchestration.md       the finished machines (Octopus, GitLab,
                           Harness, ServiceNow DevOps) + GOV.UK's real
                           public pipeline as reference architecture
  agents-md-layering.md    the hierarchical AGENTS.md system + migration
  ascii-diagrams.md        AWS-style ASCII diagram conventions

templates/
  agents/                  AGENTS.root + AGENTS.subtree templates —
                           the layering system ready to fill in
  oss-stack.md             curated OSS per layer (impeccable, pstack, graphify…)
```

MIT — take what fits, leave what doesn't.
