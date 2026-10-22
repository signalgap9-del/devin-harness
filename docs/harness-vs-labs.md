# Our harness vs the labs' standard — honest diff

Compared against the *published* Anthropic (Claude Code) and OpenAI (Codex)
harness structures, not marketing. Sources: `openai/codex`
`codex-rs/core/hierarchical_agents_message.md`, `agents_md.rs`,
`codex-rs/app-server/README.md`; `anthropics/skills` + agentskills.io spec;
Claude Code plugins reference (hook lifecycle events).

## What the public structures actually look like

| Standard | Where it lives | Shape |
|---|---|---|
| Hierarchical AGENTS.md | codex `agents_md.rs` | walk root→cwd, **concat every AGENTS.md on the path**, deeper overrides shallower, prompt outranks all |
| Plugin bundles | `anthropics/claude-code` `plugins/` | `.claude-plugin/plugin.json` + `commands/ agents/ skills/ hooks/ .mcp.json` — portable, marketplace-installable |
| Skills spec | `anthropics/skills`, agentskills.io | SKILL.md + metadata, dynamic loading |
| Hook lifecycle | Claude Code plugins ref | **~15 events**: SessionStart, UserPromptSubmit, UserPromptExpansion, PreToolUse, PermissionRequest, PermissionDenied(`retry:true`), PostToolUse, PostToolUseFailure, PostToolBatch, SubagentStart/Stop, TaskCreated/Completed, Stop… |
| Prompt-based hooks | same | hook payload evaluated by an LLM, not just a shell matcher |
| Network policy | codex app-server | managed layered TOML, domain allowlist, reload **revokes live requests** |

## Where ours actually diverges — the real gaps

### 1. Monolith AGENTS.md — the big one

Ours: one ~1000-line root file, loaded **in full every session**, mixing
product rules, ops maps, secret names, incident notes. The labs' model is
hierarchical: lean root + per-directory files scoped to their subtree —
a file's rules load only when you touch that tree.

Consequence we already feel: every session pays the full context cost and
instruction-following decays as the file grows (the "burned" lessons
section keeps accreting). **Fix: split into layers** — root stays
≤100 lines of non-negotiables; `apps/web/AGENTS.md`, `server/AGENTS.md`,
`ops/AGENTS.md` carry subtree rules; incident lessons extract to
`docs/incidents/` with a two-line index.

### 2. Only 2 of ~15 hook events wired

We run PreToolUse ×2 + PostToolUse ledger. High-value events we're not
using:

- **UserPromptSubmit** — classify the request and inject requirements.
  This is the answer to "how do you *force* online research": a prompt
  hook that detects external-claim questions and injects
  verify-with-sources obligations **deterministically**, not via
  skill-description goodwill.
- **SessionStart** — secret-drift check (registry vs `wrangler secret
  list`), stale-lock check, git-state summary. Starts every session
  informed instead of discovering mid-task.
- **Stop** — claim verification: "did tests actually run in this
  session?" The ledger has the evidence; a Stop hook can refuse the
  "done" claim without it.
- **PermissionDenied + retry** — our guard blocks are terminal. The
  standard pattern lets the agent retry with a safer variant in-band.

### 3. No managed-agent split

Anthropic's managed agents separate **brain (orchestrate) from hands
(execute)**. We run single-threaded: one agent plans, edits, gates,
deploys. Grokbot is the brain-shaped slot; under-used until parallel
sessions are routine.

### 4. No review surface

Agent-volume broke Anthropic's review flow → they built Antique. Our
equivalent evidence (ledger JSONL, jev verdicts) has **no human-readable
surface**. `jev-review`'s local dashboard is the poor-man's Antique —
worth adopting before session count grows.

### 5. Not packaged as a portable bundle

Our skills/hooks are repo-local. The standard package is the plugin
manifest layout — `.claude-plugin/plugin.json` + component dirs. This
repo *is* that bundle in spirit; adopting the manifest layout would make
it installable into Claude Code/Codex surfaces instead of copy-paste.

### 6. No egress policy

Codex app-server enforces a layered TOML domain allowlist with live
revocation. Our agent's outbound network is unbounded — a prompt-injected
"curl attacker.example" isn't structurally limited. Local guard blocks
obvious strings; an actual egress layer is the production version.

## Where we're genuinely ahead (verified, not flattered)

- Deterministic PreToolUse blocking (`agent-guard`) — the labs lean on
  model-based permission classifiers; ours can't be talked around.
- Action ledger with secret redaction — no public lab equivalent.
- Typed-judgment deploy gate with persistent reviewer memory
  (`state.json`) — the published analogs review per-diff, stateless.
- Canary-on-real-path post-deploy probes.
- spec-stage judging (`--spec`) — rejecting ideas before diffs.

## Evolution path — what each catalogued tool is *for*

```
now ──────────────────────────────────────────────────────────
AGENTS.md split (hierarchical)      -- costs nothing, biggest win
UserPromptSubmit + Stop hooks       -- enforces research + claims
SessionStart drift check            -- secret/lock surprises die
──────────────────────────────────────────────────────────────
soon (when session volume grows)
jev-review dashboard (poor-man's Antique)
impeccable detect in gate           -- authored-UI quality bar
pstack playbook content             -- workflow skills, not router
──────────────────────────────────────────────────────────────
later (triggered by scale, not fashion)
grokbot dispatch                    -- when parallel sessions > 2/day
graphify                            -- when multi-repo/audit needs hit
plugin manifest packaging           -- when installing elsewhere
egress policy layer                 -- before untrusted input paths grow
```
