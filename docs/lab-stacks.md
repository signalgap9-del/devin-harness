# How the labs actually build — Anthropic & OpenAI engineering

Researched against the live engineering pages (Oct 2026). Dates are real;
each item links the doctrine to what it means for a small team.

## Anthropic — the October 2026 state

```
            merges/day
  2.5k ──────────────────────────► 30k+          (Jan → Sep 2026)
   │                                │
   │   git couldn't hold it         │
   ▼                                ▼
  ┌─────────────────────────────────────────────┐
  │  Scion        — in-house VCS (replaced git) │
  │  Antique      — code review surface         │
  │  code search  — built in the same 5 months  │
  │  SC IAM       — source-control permissions  │
  └─────────────────────────────────────────────┘
        built by Claude, for Claude's output volume
```

- **Scion** (Oct 13, "Redesigning source control") — when agents produce
  the code, dev-infra becomes the bottleneck. They migrated the monorepo
  off git in 5 months. Lesson for us: not "build your own git" but
  **every human-scale tool becomes the constraint once agents write
  code** — review surface, CI capacity, merge queue.
- **Claude Code code review** (claude.dev) — optimize for minimum human
  review time that doesn't raise reverts/incidents; high coverage first.
- **Containment** (May 25, "How we contain Claude across products") —
  sandboxing model across surfaces.
- **Auto mode** (Mar 25) — permission skipping done safely: a classifier
  gates commands instead of blanket prompts. Same idea as our
  `agent-guard.mjs` — deterministic/policy check before execution.
- **Managed agents** (Apr 8) — "decoupling the brain from the hands":
  orchestrating fleets where reasoning is separate from execution.
- **Harness design** (Mar 24 + Nov 26 '25) — long-running agent
  performance is a *harness* property, not just a model property.
- **Context engineering** (Sep 29 '25) — the canonical post on getting
  the right info into context (their name for this whole discipline).
- **Agent Skills** (Oct 16 '25), **code execution w/ MCP** (Nov 4 '25),
  **writing tools for agents** (Sep 11 '25) — tools/skills as the
  capability surface.
- **Code search at Anthropic** — note: agentic search (grep cycles), not
  RAG indexes. They built code search *inside* Scion for humans/review,
  which is a different thing from agent retrieval.
- **Postmortems in public** (Apr 23 quality reports, Sep 17 '25
  three-issue postmortem) — incidents get written up; that's the culture
  our `patterns.md` imitates.

## OpenAI — Codex harness

```
user ──► prompt ──► inference ──► response
                      │               │
                      │        tool call request
                      │               ▼
                      └──────── tool execution
                       (sandbox + approvals + MCP + skills)

App Server = bidirectional JSON-RPC between harness and every surface
             (CLI / VS Code ext / web app / macOS app)
             thread lifecycle · config+auth · sandboxed tool exec
             SQ/EQ pattern (submission queue ⇄ event queue)
```

- **"Unrolling the Codex agent loop"** — the loop is the product: prompt →
  infer → tool call → observe → repeat. The model is a component; the
  loop is the engineering.
- **"Unlocking the Codex harness / App Server"** — one harness, every
  surface. The client-facing JSON-RPC is what you'd build a Grok Bot
  integration on.
- **"Codex as a platform"** — their own words: *harness design
  materially changes results* — on ARC-AGI-3, retained reasoning +
  context compaction took GPT-5.6 Sol from 13.3% → 38.3% while cutting
  output tokens 6×. Model same, harness different, score tripled.

## What transfers to a two-person SaaS

| Lab-scale thing | Our equivalent |
|---|---|
| Scion (VCS for agent output volume) | our deploy gate + ledger — review surface for agent output |
| Auto-mode permission classifier | `agent-guard.mjs` deterministic blocks |
| Harness > model | hooks + skills + AGENTS.md = our harness; this is where the leverage is |
| App Server surfaces | MCP config — one config, every tool surface |
| Public postmortems | `patterns.md` — burns become doctrine |
| Managed-agents brain/hands split | Grok Bot orchestrates, Devin executes (`agent-orchestration.md`) |

The honest takeaway: at our scale the labs' *mechanisms* matter
(harness discipline, deterministic gates, postmortems), not their
*implementations* (you do not need a custom VCS).
