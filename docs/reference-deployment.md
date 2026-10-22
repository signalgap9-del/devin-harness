# Reference deployment — the hypothetical full install, in numbers

Design-only (no install yet). What the stack looks like when everything
named lands on a real repo, with the cost of each piece in tokens and
money. Token figures are engineering estimates — measured claims are
flagged; verify before quoting externally.

## Agent roster — who runs what

| Agent | Role | Runs on | Cost model |
|---|---|---|---|
| Devin session | executor — codes inside the harness | Devin CLI/Desktop | per-session usage (bills — dedupe rule exists because of this) |
| Grokbot | dispatcher — opens sessions on signals | grokbot.dev SaaS | subscription; ~zero token cost (never reads code) |
| pstack arena panel | adversarial multi-model review | Claude+Codex+Grok CLIs + Bun | 3 model calls per challenge — expensive, gate it |
| Jev | typed judge over diffs | Decision API | per-call (cents-class — verify current pricing) |
| Devin Oncall | incident responder | Devin | per-session |
| Cron | dumb trigger | GH Actions schedule / OS cron | free |

## Token budget — ambient (every session, always loaded)

| Piece | Now | After design | Note |
|---|---|---|---|
| AGENTS.md (monolith ~1000 lines, livepair) | ~9–10k | ~2.5k | root ≤100 lines + one subtree — saves ~7k/session |
| Own 11 skills (descriptions only) | ~1k | ~1k | bodies load per-invoke |
| pstack subset — 12 of 59 | 0 | ~1.2k | workflows only, NOT the 19 principle docs |
| agent-skills missing — ~10 of 24 | 0 | ~1k | see overlap finding below |
| pstack-claude auto-fire mandate | 0 | ~0.3k | SessionStart injection (their measured figure) |
| session-start report | 0 | ~0.3k | generated, bounded |
| **Total ambient** | **~10k** | **~6k** | net −4k while adding ~25 workflow skills |

## Per-invoke costs (loaded only when a skill fires)

| Thing | Tokens per use | Trigger |
|---|---|---|
| any SKILL.md body | ~1–4k | auto on task match |
| prompt-guard injection | ~0.25k | external/capability question |
| arena (3-model challenge) | ~10–50k | important diffs only — NOT every commit |
| graphify query | ~1.7k | structure questions; vs ~120k naive re-read (vendor benchmark) |
| jev typed review | ~1–2k | gate/spec review |

## The overlap finding — don't double-install

The user's Devin skill set ALREADY contains ~15 of Osmani's 24
agent-skills as built-ins (spec-driven-development, ci-cd-and-automation,
code-review-and-quality, debugging-and-error-recovery, doubt-driven,
frontend-ui, security-and-hardening, performance-optimization,
interview-me, planning-and-task-breakdown, source-driven-development,
shipping-and-launch, code-simplification, constraint-driven-development,
using-agent-skills). The ~10 unique adds worth vendoring:
api-and-interface-design, browser-testing-with-devtools,
deprecation-and-migration, documentation-and-adrs,
git-workflow-and-versioning, idea-refine, incremental-implementation,
observability-and-instrumentation, test-driven-development,
context-engineering (have it as doc — promote to skill).

pstack (59 entries): only ~12 workflow skills worth it —
how, why, architect, arena, interrogate, deslop, correct,
figure-it-out, ketchup, reflect, automate-me, tdd.
The 19 principle-* files are reference essays — keep OUT of skills,
they'd burn ambient tokens for prose.

## Install order (when triggered — numbered, not now)

```bash
# 1. packs → vendor subsets into .devin/skills (MIT, NOTICE.md attribution)
#    ~12 pstack workflows + ~10 agent-skills = +~2.2k ambient
# 2. AGENTS.md layering → −7k ambient immediately
# 3. dispatch → grokbot account + DEVIN_API_KEY + thresholds:
#    index-refresh every 20 merges, hygiene weekly, dedupe per class
# 4. arena CLIs → only when diffs justify 3-model review
# 5. graphify → only if repo structure questions outnumber grep wins
```

## What the numbers say (the design verdict)

The correct install is **subsets, not packs**: full pstack would cost
~5k ambient for 19 essays + skills we already have; the 12-skill subset
costs ~1.2k. Same for agent-skills — 60% overlap already. The dominant
win isn't any pack — it's **AGENTS.md layering** (~7k/session saved)
plus the **dispatcher** (which removes human orchestration, not tokens).
Money-wise the only unbounded cost is dispatched sessions — hence
dedupe + thresholds are the entire economics of the dispatch layer.
