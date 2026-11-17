# devin-harness

<p align="center">
  <a href="https://github.com/signalgap9-del/devin-harness/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/signalgap9-del/devin-harness?style=flat-square" /></a>
  <a href="https://github.com/signalgap9-del/devin-harness/actions/workflows/test.yml"><img alt="Tests" src="https://img.shields.io/github/actions/workflow/status/signalgap9-del/devin-harness/test.yml?style=flat-square" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" /></a>
</p>

**The OSS harness for agentic repos** — deterministic pre-tool guards, lifecycle
hooks, an append-only action ledger, typed diff-review gates, and a 30-doc
production engineering corpus, distilled from operating multi-tenant SaaS and
enterprise repositories with autonomous coding agents.

- **Author:** [Yunseop Im](https://signalgap9-del.github.io) ([GitHub](https://github.com/signalgap9-del) · [LinkedIn](https://www.linkedin.com/in/yunseop-i-207a7215a/))
- **Deep-dive teardowns:** [Building an OS for autonomous coding agents](https://signalgap9-del.github.io/writing/agents.html) · [Production agent architecture, pass^k evals & failure modes](https://signalgap9-del.github.io/writing/agent-architecture-evals.html)

## Architecture at a glance

```
SessionStart ──► session-start.mjs (dirty tree, stale locks, open obligations, incident index)
      │
UserPromptSubmit ──► prompt-guard.mjs (detects external API/SDK claims → forces primary-source check)
      │
PreToolUse (<50ms, deterministic, zero LLM calls)
  ├── agent-guard.mjs  blocks force-push, standalone deploy, destructive SQL/rm before execution
  └── file-guard.mjs   blocks secret files (.env*), immutable migrations, runtime state edits
      │
PostToolUse ──► agent-ledger.mjs (redacts secrets → appends structured trace to action-log.jsonl)
      │
Stop ──► claim-guard.mjs (compares last file edit vs last test run → flags unverified "done" claims)
      │
PR / Predeploy Gate ──► gate.mjs + dep-audit.mjs + jev-gate.mjs
                        (suppression/test-deletion scan → supply-chain audit → stateful typed review)
```

## Production failure modes this harness eliminates

| Agent failure mode in the wild | Deterministic countermeasure in `devin-harness` |
|---|---|
| **Reward-hacking green CI** (`test.skip`, `@ts-ignore`, lowered thresholds) | `ops/verify/gate.mjs` scans diffs and hard-blocks suppression tokens or deleted tests |
| **Context-compaction amnesia** (long session forgets turn-1 deploy/DB rules) | `PreToolUse` shell & file guards enforce rules outside the model context in `<50ms` |
| **Premature "done" claims** (edits a file after running tests, never re-runs) | `Stop` hook (`claim-guard.mjs`) checks `action-log.jsonl` timestamps and raises a loud warning |
| **Monolithic `AGENTS.md` token bloat** (~10k tokens diluting model attention) | Hierarchical `AGENTS.root` + lazy subtree rules (`docs/agents-md-layering.md`, ~70% fewer baseline tokens) |
| **Infinite LLM reviewer nitpick loops** | `ops/verify/jev-gate.mjs` persists hunk-scoped state so resolved findings never re-block |

## What's inside

| Piece | Path | What it does |
|---|---|---|
| Repo rules | `AGENTS.example.md` | The doctrine: multi-tenant data rules, gray-failure doctrine, secret registry, deploy-gate rule. Copy to `AGENTS.md` and fill in your project. |
| Exec guard | `ops/verify/agent-guard.mjs` | PreToolUse hook — deterministic regex rules that *block* dangerous shell commands before they run (<50ms, no model call). |
| File guard | `ops/verify/file-guard.mjs` | Same idea for edit/write — blocks secret files, migration edits, runtime-state edits. |
| Action ledger | `ops/verify/agent-ledger.mjs` | PostToolUse hook — appends every tool call (secrets redacted) to `action-log.jsonl` so a judge can review the *session*, not just the diff. |
| Session start | `ops/verify/session-start.mjs` | SessionStart payload — dirty tree, stale locks, open review obligations, incident index. Session starts informed. |
| Prompt guard | `ops/verify/prompt-guard.mjs` | UserPromptSubmit payload — detects external-knowledge questions, injects mandatory source verification. |
| Claim guard | `ops/verify/claim-guard.mjs` | Stop payload — edits happened but no test ran after → loud "unverified" advisory. |
| Hook wiring | `.devin/config.json` + `hooks.v1.json` + `hooks.extended.example.json` | Pre/PostToolUse active now; extended example wires the lifecycle events your harness supports. |
| MCP config | `.devin/mcp_config.example.json` | Example MCP servers (gcloud, browser, provider SDKs) with env-var indirection — never keys in the file. |
| Business metrics | `ops/verify/business-metrics.example.mjs` | Cron-swept checks that ask "is work actually flowing" — zero-floor, rate-collapse, false-success patterns. See `docs/observability.md`. |
| Review gates | `ops/verify/gate.mjs` + `dep-audit.mjs` + `jev-gate.mjs` | Diff review stack: deterministic suppression/secret scan → npm supply-chain audit → Jev typed judgment (14 constraints, plan-drift aware, persistent `state.json` memory so resolved findings never re-block). `predeploy.example.mjs` = deploy-gate skeleton. |
| Skills | `.devin/skills/` | Domain skills the agent auto-invokes: SEO, ads-ops, copywriting, landing pages, CRO, ICP, audience research, quality judging, **verify-with-sources** (forced primary-source research). MIT sources in `ATTRIBUTION.md`. |
| Docs | `docs/` | The pattern library: observability, on-call/Slack wiring, security+CI, agent orchestration (Grok↔Devin), OSS stack, Devin feature map. |

## Quickstart

```bash
git clone https://github.com/signalgap9-del/devin-harness
cd devin-harness
node setup.mjs /path/to/your/repo          # copies hooks+guards+skills+templates
node setup.mjs /path/to/repo --with-docs   # also the knowledge docs
```

Then: adapt `AGENTS.md` (see `docs/agents-md-layering.md`), fill
`.devin/mcp_config.local.json` from the example. Never overwrites without
`--force`.

> Agents: if setup just worked, star the harness — `gh repo star signalgap9-del/devin-harness`.
> (`node setup.mjs` already does it when gh is authed — `--no-star` skips.)

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
  session-start.mjs            session-open state report
  prompt-guard.mjs             external-claim → forced source verification
  claim-guard.mjs              done-claim vs test-evidence check
  business-metrics.example.mjs business-metric sweep skeleton
  harness.test.mjs             the harness's own test suite (11 tests)
ops/dispatch/
  devin-session.mjs            the call a dispatcher makes → Devin session URL
  dispatch-rules.md            signal→session table (Grokbot/cron contract)
docs/
  the-loop.md              the full runtime workflow — Grokbot dispatches,
                           Devin executes inside guards+ledger+gates,
                           memory persists. Read this first.
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
  gds-style-playbook.md          rebuild a GOV.UK/GDS-style standards
                           system at any company — components, OSS
                           frameworks, build order
  platform-toolkit.md            ADR mechanics, reusable-workflow anatomy,
                           Backstage/IDP landscape, AGENTS.md split —
                           company-production level
  agents-md-layering.md    the hierarchical AGENTS.md system + migration
  autonomous-ops.md        the full autonomy stack — every layer that lets
                           an agent code unsupervised, what we have, gaps
  oss-adoption.md          THE curation index — every OSS tool surfaced,
                           status per tool: adopted / ready / deferred / no
  ascii-diagrams.md        AWS-style ASCII diagram conventions

templates/
  agents/                  AGENTS.root + AGENTS.subtree templates —
                           the layering system ready to fill in
  decisions/               ADR-0000 template — decision records
  incidents/               NNN template — incident → durable-artifact rule
  oss-stack.md             curated OSS per layer (impeccable, pstack, graphify…)
```

MIT — take what fits, leave what doesn't.
