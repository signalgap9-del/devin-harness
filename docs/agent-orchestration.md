# Agent orchestration — Grok Bot + Devin, multi-agent patterns

Devin is the long-running worker. Other agents can orchestrate it rather
than replace it — the pattern that works is **bots manage, Devin executes**.

## Grok Bot → Devin

Three real integration paths (all live as of this writing):

1. **grokbot.dev "Devin Manager" template** — a shared bot that opens
   Devin sessions for each job, watches them run, and steps in when the
   agent drifts. Results (screenshots, test recordings) land back in chat.
   It's a *team of bots* — roles stay separate. Read shared-bot
   instructions before installing; never paste keys into them.
2. **crosswalk.to** — a shared message bus over MCP. Grok posts a task,
   Devin reads it and reports back; both sides just poll the same channel.
   Setup: Grok connector → `https://mcp.crosswalk.to`; Devin → Customize →
   MCPs → add custom MCP (HTTP transport, same URL) → paste the key where
   Devin asks (not in chat).
3. **Composio / Devin MCP** — managed OAuth/tooling layer if you want
   Grok to call Devin's API surface (start sessions, query PRs) through
   1,500+ managed integrations with an audit trail.

Which to pick: crosswalk for quick two-agent ping-pong, the Devin Manager
template for "watch my fleet", Composio when you need managed auth +
audit for a team.

## The orchestration rules that matter

- **Bots manage, agents execute.** The orchestrator hands over a job spec
  and checks outcomes; it doesn't babysit keystrokes.
- **Every agent output lands somewhere reviewable** — a PR, a chat post,
  an artifact — never a private scratchpad.
- **One job, one session.** Parallel sessions on the same files create
  conflicts the orchestrator then has to untangle.
- **Secrets never cross the bus.** Keys live in each side's credential
  store; the bus carries task text and results only.
- **The guard layer still applies.** Whatever channel a task arrives by,
  the repo's hooks gate what the executing agent may do — orchestration
  doesn't route around `agent-guard.mjs`.

## Devin's own multi-agent feature

You don't strictly need an external orchestrator: a Devin session can
delegate workstreams to parallel managed Devin sessions (isolated VMs)
through its Advanced Capabilities. External bots shine when the
coordinator should live where the conversation already happens (X/Telegram/
Slack-side) or when it must outlive any single session.
