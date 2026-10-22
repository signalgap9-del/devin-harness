# Context engineering — the "works without hand-feeding" stack

The goal: an agent that opens a session and behaves correctly *without* the
owner pasting context every time. It's a layer cake — each layer answers a
different question, none replaces another.

```
what is this project      → AGENTS.md            (repo, committed)
how should you act        → AGENTS.md rules + hooks (enforced, not hoped)
what do you know already  → Memory               (learned corrections, personal)
what does this task need  → Skills               (auto-invoked on match)
where is the code         → Code graph           (graphify or equivalent)
what did the agent do     → action ledger        (ops/verify/action-log.jsonl)
is it actually working    → canaries + metrics   (ops/verify/*)
```

## The layers

**AGENTS.md** — orientation. Commands, hard rules, deploy doctrine, secret
registry. Loaded every session; costs nothing; skips the "explore the repo
to learn it has a deploy gate" turn entirely.

**Memory** — learned corrections across sessions ("never X here — burned
once"). Personal, lives outside the repo. The pair to AGENTS.md:
repo = shared truth, memory = personal lessons.

**Skills** — task-matched procedures that auto-invoke. In Devin, skill
invocation is the router — a matching description pulls the skill in.
(In Cursor this layer needs an explicit router skill — that's what
pstack's `poteto-mode` is for.)

**Code context** — honest version: Anthropic *tried* codebase RAG/indexing
(Voyage embeddings) and deliberately dropped it for **agentic search** —
grep/glob/read cycles over the live tree. Boris Cherny's reasons: indexes
drift out of sync with active code, a hosted index is a security liability,
and iterative search simply worked better. Cost: latency + tokens. Their
lever is codebase *legibility* — lean layered CLAUDE.md/AGENTS.md files,
good naming — not an index.

So grep is not underkill; it is the deliberately chosen standard. A graph
(graphify: local tree-sitter → queryable graph, `file:line` citations,
EXTRACTED/INFERRED edge tags) starts paying when: the repo is too big to
grep-read affordably, many repos share context, or answers need audit-grade
provenance (regulated/enterprise work). For a single focused repo with a
good AGENTS.md, agentic search is the Anthropic-matching choice.

**Ledger** — the behavioral record for review.

**Canaries/metrics** — truth about the *running* system, covered in
`observability.md`.

## If you do want the graph

```bash
uv tool install graphifyy   # or: pipx install graphifyy
graphify install            # registers the skill for your assistant
                            # (--platform codex|opencode|claw also works)
```

Architecture (verified, pytorch.kr writeup + repo): **two-pass** —
deterministic tree-sitter AST extraction runs locally with *no LLM*,
then parallel LLM subagents extract semantic relations from docs/PDFs/
diagrams. Merged into a NetworkX graph, Leiden-clustered into
communities. Every edge is confidence-tagged: `EXTRACTED` (1.0, from
code) / `INFERRED` (scored, from docs) / `AMBIGUOUS` — honesty is built
into the data model. Outputs: `graph.html` explorer, `GRAPH_REPORT.md`
(god nodes + surprising connections + suggested questions), `graph.json`
(persistent), SHA256 cache (re-runs process changed files only).
`--neo4j` export exists. Verified benchmark: 71.5× token reduction on
the karpathy-repos corpus (~123k → ~1.7k/query).

Then AGENTS.md gains two lines:

```
- Structural question? `graphify query|path|explain` BEFORE reading files.
- After editing code: `graphify update .` — keep the map current.
```

Costs/caveats (be honest): indexing spends LLM tokens on docs/PDFs;
`INFERRED` edges must not be trusted like `EXTRACTED` ones; the graph
**goes stale** unless updated — a stale map teaches wrong. Freshness
ownership: a cron or Grokbot-dispatched "refresh graphify index" task
after N merges fits the dispatcher role (`grokbot-architecture.md`) —
maintenance work, not judgment work. Trigger to adopt remains: grep
cycles visibly burning session time, or multi-repo/onboarding-heavy work.

## What this replaces

| Hand-fed prompt | Layer that owns it now |
|---|---|
| "our deploy goes through the gate, don't hand-run wrangler" | AGENTS.md + agent-guard blocks the raw command |
| "we use X library, our tables are tenant-scoped" | AGENTS.md + Memory once corrected |
| "the picker is vendored from open-higgsfield, extend don't replace" | Memory + code graph (structure) |
| "where does generation submit happen" | code graph query instead of a guided tour |
| "check nothing silently fails" | canaries + ledger review |
