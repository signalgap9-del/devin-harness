# Autonomous ops — what makes an agent able to code unsupervised

The question this repo answers: Anthropic's agents code for hours without a
human watching every diff. Not because the model is trusted — because the
ENVIRONMENT makes bad moves impossible and unverified claims loud. This doc
is the checklist: every mechanism that buys autonomy, what we have, and how
to install it via `setup.mjs`.

## The autonomy stack (each layer removes a failure class)

| Layer | Mechanism | What it prevents | Ours |
|---|---|---|---|
| **Context** | layered AGENTS.md (root ≤100 lines + subtree files) | agent wanders with wrong/no rules | `templates/agents/` |
| **Boundaries** | PreToolUse guards | dangerous commands, secret-file edits, destructive ops | `agent-guard.mjs`, `file-guard.mjs` |
| **Evidence** | PostToolUse ledger | "the agent said it tested" is unfalsifiable → ledger makes every action auditable | `agent-ledger.mjs` → `action-log.jsonl` |
| **Start state** | SessionStart report | agent assumes clean tree, misses stale locks/open obligations | `session-start.mjs` |
| **Research truth** | UserPromptSubmit injection | external claims from memory = confident wrongness | `prompt-guard.mjs` + `verify-with-sources` skill |
| **Done honesty** | Stop-hook check | "done" claims with no test run after last edit | `claim-guard.mjs` (advisory) |
| **Memory** | skills (declarative) + ledger (episodic) + state.json (synapse) | same mistakes re-paid every session | `.devin/skills/`, `ops/verify/state.json` |
| **Judgment** | Jev typed review over diffs | properties tests don't check: scope creep, weakened bar, missing verify path | `jev.mjs` (livepair repo) |
| **Release truth** | canary + ledger + gates | 200-OK-but-broken deploys, silent webhook death | `predeploy.mjs`, `auth-canary.mjs` |

## What Anthropic's stack does that we don't (yet)

- **Auto-mode permissioning** — Claude Code can run in a mode where
  allowlisted tools execute without prompting. Equivalent here: the guards
  ARE the permission list; whatever isn't blocked runs. Tighten the guard,
  widen autonomy.
- **Scale of the VCS itself** (Scion) — only needed when merges/day
  exceed Git's comfort; our trigger is documented in `docs/oss-stack.md`.
- **Review surface** (Antique) — a dedicated UI for agent diffs at volume.
  Our equivalent today: ledger + Jev + PRs. If agent output grows past
  human review bandwidth, this is the first build.
- **Meta-work tooling** — their Oct-16 post: employees' bottleneck moved to
  watching agent pipelines. Our `business-metrics` sweep + ledger is the
  seed of that observability.

## Install (one command)

```bash
git clone https://github.com/signalgap9-del/devin-harness
cd devin-harness
node setup.mjs <target-repo>            # runnable layer only
node setup.mjs <target-repo> --with-docs # + the knowledge docs
```

Then the three manual steps the script prints: adapt AGENTS.md, fill
`.devin/mcp_config.local.json`, verify the guard runs.

## After install — extend by trigger, not by taste

- New incident class → `templates/incidents/NNN.template.md` in
  `docs/incidents/` (never leave it in AGENTS.md — see
  `docs/agents-md-layering.md`)
- New irreversible call → ADR in `docs/decisions/` from
  `templates/decisions/ADR-0000.template.md`
- New dangerous action → rule in `agent-guard.mjs` (test: echo the
  command JSON | node agent-guard.mjs)
- Harness gains a new hook event → wire from
  `.devin/hooks.extended.example.json`

## Honest limits

Autonomy ≠ the agent is right. This stack makes it **impossible to break
things silently and impossible to claim unverified work quietly** — the
agent can still be wrong, it just can't be wrong *invisibly*. That is the
real product Anthropic's infra sells internally, and it's the part you can
rebuild anywhere.
