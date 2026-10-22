# Devin feature map

What the platform actually ships (docs.devin.ai), and how each piece maps to
this harness. Not marketing — the mechanics.

## Memory & Dreaming

Devin saves preferences, corrections, and project lessons into a **memory
drive** — a persistent Git repo of Markdown notes that carries across
sessions.

- `MEMORY.md` loads as context every session; other notes are searched/read
  on demand when the task needs them.
- Entries are one-line bullets linked back to the session that taught them.
- Parallel sessions write to the same drive; conflicting edits merge.
- Personal per-org — not shared with teammates.
- Saved: preferences, corrections-with-the-rule, decisions. **Not** saved:
  session summaries, task state like PR numbers.

Harness angle: `AGENTS.md` + skills are *shared* durable knowledge; Memory
is *personal* learned knowledge. They complement — rules live in the repo,
your corrections live in memory.

## Devin OnCall

Investigate/fix/mitigate alerts, bugs, incidents. Three products:

- **Responders** — investigate alerts/bug reports/support questions as they
  arrive, using telemetry + code + deployments + runbooks + past incidents.
- **Incidents** — root-cause, mitigate, drive to resolution; open fix PRs.
- **Reports** — recurring insight reports: which alert thresholds to tune,
  recurring issue classes, what Devin fixed/merged.

## Playbooks

Reusable, shareable prompt-templates ("custom system prompt for a repeated
task") in the web app. Use when the same multi-step task recurs across
sessions or teammates. For best-practices/style guides, **Skills** are the
better vehicle — playbooks are for task workflows.

## Advanced capabilities

- **Parallel managed sessions** — break a task into workstreams, each run by
  an isolated VM session.
- **Session analysis** — "why did this session cost 42 ACUs / where did it
  get stuck" — post-mortems on your own sessions.
- **Knowledge management** — dedupe/consolidate/create org knowledge entries
  from the codebase.
- **Schedules** — recurring or one-shot automated sessions (cron for agents).

## Skills

`SKILL.md` files under `.devin/skills/` (project) or the user-level skills
dir. The agent auto-invokes them when a task matches. This repo's
`.devin/skills/` is a working example set.

## Hooks

`.devin/config.json` `hooks` — shell commands fired on tool events:

- `PreToolUse` — can *block* a tool call (exit 2). This repo's
  `agent-guard.mjs` / `file-guard.mjs` are the pattern.
- `PostToolUse` — runs after; `agent-ledger.mjs` logs actions.

## MCP servers

`.devin/mcp_config.json` — stdio (`command`/`args`/`env`) or HTTP
(`url`/`transport`) servers. Official servers exist for gcloud, GitHub,
Slack, Linear, ad platforms, provider SDKs. `mcp_config.example.json` here
shows the shape — env-var indirection, never keys.

## Surfaces beyond the CLI/IDE

- **Devin API** — programmatic session creation/control.
- **Slack/GitHub/Linear integrations** — tag Devin in issues/PRs/tickets.
- **Ask Devin** — codebase Q&A without spawning a session.
- **Devin's Review** — PR review comments.
- Session links are shareable; the IDE panel lets you watch or take over.

## What this harness adds on top

Devin gives memory + hooks + skills + MCP. This repo adds the *opinionated
layer*: the deterministic guards (rules that can't be talked out of), the
action ledger (session-level auditability), the deploy-gate doctrine, and
the gray-failure/canary patterns encoded in `AGENTS.example.md`.
