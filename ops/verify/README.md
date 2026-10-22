# ops/verify — the guard layer

Three scripts, wired by `.devin/config.json` hooks:

| Script | Hook | Role |
|---|---|---|
| `agent-guard.mjs` | `PreToolUse` on `exec` | Regex rules over the shell command. Exit 2 = blocked; the reason goes back to the agent. |
| `file-guard.mjs` | `PreToolUse` on `edit`/`write`/`notebook_edit` | Same for file paths/content — secret files, immutable migrations, runtime state. |
| `agent-ledger.mjs` | `PostToolUse` on all | Appends every action (secret-redacted, 300-char truncated) to `action-log.jsonl`. |

## Why deterministic guards

Prompt-level rules ("never force-push") work until the model forgets,
rationalizes, or hits a long session. A hook can't be talked out of — it
runs before every call, costs <50ms, and fails *closed* (unparseable
payload = block). The agent reads the block reason and adjusts; the owner
never has to.

## Writing project rules

Append to the marked section of each guard. A rule is a regex on the
lowercased command (or normalized file path) plus `block("reason")`.
Fail-closed means: if the guard can't inspect it (unreadable SQL file,
unparseable payload), block rather than wave through.

Keep the block reason actionable — it's the agent's only signal for what
to do instead.

## The bigger gate pattern

These hooks police *during* the session. The same repo pattern scales to a
deploy gate: a sequential checklist (diff audit → schema drift → typecheck
→ tests → local boot → route smoke → visual check → copy audit) that must
pass before any upload runs, where **every step fails loud and every child
process has a timeout**. `action-log.jsonl` doubles as the gate's input —
an LLM judge can review the session's behavior against AGENTS.md, not just
the final diff.
