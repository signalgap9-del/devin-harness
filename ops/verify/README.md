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

## The bigger gate pattern — the review stack (ported from production)

Beyond the in-session hooks, this directory carries the full review stack:

| Script | Role |
|---|---|
| `gate.mjs` | Deterministic diff gate — forbidden suppressions/skipped tests/secret-shaped literals in added lines + route smoke (200 AND SSR marker). No model anywhere. |
| `dep-audit.mjs` | Supply-chain gate — every NEW dependency in a package.json diff checked against npm truth: publish age (<7d blocks), weekly downloads, deprecated flag, OSV vulns. |
| `jev-client.mjs` | Jev typed-judgment client — one `judge()` call checks every constraint at once; 0.8 confidence threshold blocks. Needs `jev-use` (optional dep) + `TYPESAFE_API_KEY`. Missing either → advisory-only, determinism still gates. |
| `jev-gate.mjs` | The diff review gate — collects diff (untracked files folded in as pseudo-hunks, else new files bypass review), runs dep-audit + unvetted-endpoint scan deterministically, then Jev over diff + `action-log.jsonl` + `tasks/plan.md` (plan drift is decidable). `state.json` = persistent review memory: resolution receipts downgrade known findings deterministically so the model only ever blocks on NEW violations. |
| `predeploy.example.mjs` | Deploy-gate skeleton — rename to `predeploy.mjs`, fill in your build/boot steps, wire `npm run deploy` through it so a bare deploy command can't bypass the gate. Deploy lock + NODE_OPTIONS floor + process-cleanup patterns included (each was a real incident). |

`state.json`, `action-log.jsonl`, `deploy.lock` are runtime state —
gitignored, never committed.
