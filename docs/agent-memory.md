# Agent memory — MemT, the sidekick pattern, and what to actually build

Verified against arXiv 2610.26825 (MemT-1.0, MemTensor), `zjunlp/MemP`,
and the mem0/Zep/LangMem production comparisons. Oct 2026.

## What MemT-1.0 actually is

Memory-native model: conversation/experience stored in a **fixed-size FP32
internal state** (~40 MiB Nano / ~1.28 GB Flash) instead of an ever-growing
context. Applied to coding agents via an *experience bank*: historical
trajectories → distilled procedural entries (applicable conditions,
recommended procedures, verification strategies) → retrieved per task by
BGE-M3 embedding similarity.

Results (paper's own numbers, SWE-bench Verified, Nano):
`66.07% → 69.73%` with experience in native memory — **vs ~parity with the
same experience injected as text**. Multilingual: 60.00 → 63.56%.

## The honest read for production

**The finding is real; the model isn't the product.** Native memory matched
textual experience — meaning the value is the *experience bank pattern*,
not the storage substrate. MemT's edge only appears when trajectory volume
is large enough that context-spend hurts. To run it at all you serve a
research model (GPU + ops burden) for a benefit text injection gives free.

Verdict: **adopt the pattern, skip the model** — until/unless trajectory
scale makes context cost the bottleneck.

## The sidekick pattern, done with what exists

```
  [main agent]                              [experience bank]
       │ stuck / task end / merge                │
       ├──► distill trajectory ──────────────►  │ write-gated entries:
       │    into ONE procedural entry           │  {when-applicable,
       │                                        │   procedure, how-to-
       │ task start: embed task ──► retrieve ──►│   verify, expiry}
       │◄──── 3-5 short hints, injectable    ───┘
       └─── hints are advisory — main may ignore
```

Write-side rules (the part that decides success — bad experience steers
the main agent wrong):

- **Write only on signal**: gate failure, incident resolution, repeated
  dead-ends, verified success — not every trajectory.
- **Every entry carries**: applicable condition, procedure, verification
  step, expiry. No expiry = stale advice that outlives the codebase.
- **Domain-partitioned namespaces**: deploy / payments / studio — never
  one soup. (Maps cleanly to Vectorize namespaces we already operate.)

## What we already have vs what's missing

| Piece | Status |
|---|---|
| Write side — distilled lessons | ✅ `state.json` synapse (per-file strikes, recurring violations) + AGENTS.md "burned" notes + action ledger |
| Retrieval side — embed task → fetch relevant experience | ❌ missing. We re-read everything instead of asking "what broke here last time?" |
| Expiry/correction of stale entries | ❌ `state.json` grows; nothing deprecates |
| Storage | ✅ Vectorize (`livepair-refs` pattern) or even D1 — entries are small text |

The cheapest production version: an `experience` namespace in the existing
Vectorize index + a distill-on-failure step in `jev.mjs` (it already sees
every rejection) + a SessionStart/query hook that fetches top-3 entries
for the current task area. No new service.

## Ecosystem map (verified)

| Tool | Memory type | Procedural? | Notes |
|---|---|---|---|
| **MemT-1.0** | native model state | yes (research) | parity w/ text path; GPU to serve |
| **MemP** (`zjunlp`) | experience bank, academic | **yes — the reference impl** | Build/Retrieve/Update strategies + correction/deprecation regimen |
| **mem0** | hybrid vector+entity | partial (API) | best for personalization; procedural via agent_id scoping |
| **Zep/Graphiti** | temporal knowledge graph | no | facts have validity windows — right model for "was true when" |
| **LangMem** | prompt+vector, LangGraph-native | yes | easy self-host; watch p95 latency (59.8s reported) |
| **Devin Memory** | platform markdown store | no | user prefs/corrections — NOT procedure-level experience |

Our existing pieces cover semantic (Devin Memory) and incident-episodic
(state.json/AGENTS.md) — the empty cell is **procedural memory with
retrieval**, which is exactly the experience-bank pattern above.
