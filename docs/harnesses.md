# Harnesses — who's who (Codex / Claude Code / Devin / Hermes / Grokbot)

The "which agent thing is what" map — different slots, not competitors.

## The axes that actually distinguish them

| | Codex (openai/codex) | Claude Code | Devin | **Hermes** (NousResearch/hermes-agent) | Grokbot |
|---|---|---|---|---|---|
| What it is | coding-agent **harness** (OSS) | coding-agent harness + product | managed executor (SaaS agents) | **self-hosted life-agent** (MIT, ~256k★) | **dispatcher/bot platform** — routes work to agents |
| Learning loop | AGENTS.md + skills, static | skills + memory files | Memory + playbooks, managed | **built-in closed loop**: creates skills from experience, skills self-improve during use, nudges itself to persist, searches past sessions (FTS5+summarization), Honcho user model | n/a — doesn't execute |
| Surfaces | CLI/IDE/web/macOS via app-server | terminal/IDE/Desktop/Actions | web+API sessions | **Telegram/Discord/Slack/WhatsApp/Signal/CLI/email** — one gateway, one memory | chat surfaces (it IS the bot) |
| Model lock-in | OpenAI-tuned (works w/ others) | Anthropic | Cognition's | **any** — Nous Portal/OpenRouter/own endpoint, `hermes model` switches | Grok/xAI |
| Infra | sandboxed exec, network policy | local+gated | managed envs | local/Docker/SSH/Singularity/Modal backends; cron automations; subagent delegation | opens Devin sessions via API |
| Slot in the loop | executor-harness spec | executor | executor | executor **with the memory layer built in** | **dispatch layer** — what we wired in `ops/dispatch/` |

## "Does Grokbot use Hermes?" — different layers, no

Grokbot opens/assigns work (dispatch); Hermes IS the work-doer
(executor+memory). Grokbot could dispatch TO Hermes the same way it
dispatches to Devin — the bot doesn't need a brain, it needs session
targets. Whether grokbot.dev internally runs Hermes-like machinery is
unverified; architecturally it doesn't matter — the dispatch contract
(open session → collect outcome) is layer-independent.

## Hermes vs Codex — the real difference

Not "which is better" — different objects:

- **Codex** = a *harness spec you adopt*: AGENTS.md hierarchy, app-server
  JSON-RPC, network policy. You build YOUR agent runtime around it; the
  learning/memory layer is whatever you write (that's us — skills + ledger
  + state.json).
- **Hermes** = a *batteries-included agent you run*: the learning loop is
  the product — skills get auto-created after hard tasks and improve on
  reuse, session search gives cross-session recall, cron runs unattended
  jobs to any messenger. Self-improvement is built-in, not DIY'd.

Honest position for us: **Hermes is the closest shipping reference
implementation of the "harness learns with frozen weights" research
frontier** (HCL/ReHarness/MCCL — see `research-canon.md`). Our stack
deviates deliberately where it matters — memory writes are
ledger/validated (ours is auditable; Hermes' agent-curated loop trusts
the model more). Worth tracking as the pattern to beat: if agent-curated
memory proves safe, it's less plumbing than ours.

## Where each sits in our loop (`the-loop.md`)

- Grokbot → dispatch slot (already wired: `ops/dispatch/`)
- Devin → executor slot (managed)
- Codex → the harness *convention* we follow (AGENTS.md layering)
- Hermes → **evaluate**: self-host option if we want the closed learning
  loop without building it; model-agnostic = hedge against provider lock
