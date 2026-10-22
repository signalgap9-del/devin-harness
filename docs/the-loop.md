# The loop — what actually happens when this harness lands in a repo

The whole workflow, end to end, who does what. This is the diagram that
connects every piece: Grokbot dispatching, Devin executing, guards
enforcing, packs firing, ledger remembering.

## The runtime loop

```
            ┌───────────────── DISPATCH LAYER ─────────────────┐
            │  Grokbot (or cron) watches: merges, alerts,      │
            │  queues, schedules → opens Devin sessions         │
            └──────────────────────┬───────────────────────────┘
                                   │ POST /v1/sessions {prompt}
                                   ▼
┌─ Devin session opens ─────────────────────────────────────────────────┐
│ 1. SessionStart    → session-start.mjs: dirty tree, locks,           │
│                      open obligations, incident index                │
│ 2. UserPromptSubmit→ prompt-guard.mjs: external claim? → forced      │
│                      source-verification. Capability question?       │
│                      → forced oss-adoption lookup                    │
│ 3. Skills auto-invoke (description match — no router needed):        │
│    use-the-stack    → catalog before building anything               │
│    verify-with-sources → primary-source research                     │
│    + installed packs: pstack workflows (how/why/arena/unslop/reflect) │
│      agent-skills lifecycle (/spec→/plan→/build→/test→/review→/ship) │
│ 4. PreToolUse      → agent-guard (dangerous exec) + file-guard       │
│                      (secrets/migrations) block at exit-2            │
│ 5. PostToolUse     → agent-ledger writes action-log.jsonl (every     │
│                      tool call, secrets redacted)                    │
│ 6. Gates           → predeploy/tests/typecheck — deterministic,      │
│                      jev adds typed judgment, never overrides        │
│ 7. Stop attempt    → claim-guard: edits but no test? → loud          │
│                      "unverified" advisory                           │
└──────────────────────┬──────────────────────────────────────────────┘
                       │ session ends — ledger is the receipt
                       ▼
            ┌──────── REVIEW / MEMORY LAYER ────────┐
            │ state.json synapse (open obligations), │
            │ jev rejection history, incident files, │
            │ ADRs — next session reads them all     │
            └───────────────────────────────────────┘
```

## Who plays which role

| Role | Who | Never |
|---|---|---|
| **Dispatcher** | Grokbot / cron / GitHub webhook | never writes code, never holds prod secrets — routes + watches only |
| **Executor** | Devin session inside the harness | never bypasses guards; the harness is the sandbox |
| **Gate** | deterministic scripts + jev | jev can't override hard checks |
| **Memory** | ledger + state.json + incidents/ + ADRs | memory is written at lifecycle points, not freeform |
| **Judge** | jev typed review over diffs | can't prove runtime correctness — tests do |

## The maintenance dispatches (what Grokbot actually opens)

| Trigger | Session opened | Why it's a dispatch, not a judgment |
|---|---|---|
| N merges since last index | "refresh graphify / docs index" | freshness = maintenance, not decision |
| Business-metric sweep trips | "investigate metric X collapse" | known failure classes get known sessions |
| Deploy completes | "run canary suite + update release ledger" | post-deploy ritual, always same |
| Guard rejection count spikes | "review what the agent keeps trying" | meta-work — the Anthropic-observed new bottleneck |
| Weekly | "audit stale locks, open obligations, ADR gaps" | hygiene cron |

## Install the packs (when you want them — all READY in oss-adoption)

```bash
# pstack workflows → Claude Code / Codex plugin (50+ workflow skills)
/plugin marketplace add ericlitman/open-pstack && /plugin install pstack@open-pstack

# Addy Osmani's production-grade SDLC skills (24 skills, 6 commands)
npx skills add addyosmani/agent-skills

# Hook collections — vendor per-need into ops/verify/
/plugin marketplace add karanb192/claude-code-hooks

# graphify code graph (optional context layer)
uv tool install graphifyy && graphify install
```

Note the overlap, honestly: our `.devin/skills/` already covers some of
what agent-skills does (verification discipline, spec-first). Install the
packs for the *workflows we don't have* — arena's multi-model challenge,
reflect, automate-me, unslop — not to double-stack equivalent rules.

## What still needs a human

- The **Grokbot account + Devin API key** — dispatch layer can't self-provision
- **Trigger thresholds** in `ops/dispatch/dispatch-rules.md` — sized per repo
- **First ADR + first incident file** — the folders start empty by design
- **Promoting DEFERRED tools** — each has a trigger; crossing it is a
  decision, not an automation
