# Decision models — the typed-judgment layer

The newest layer in the agentic toolchain, and the one most harnesses still
lack: a model that returns **typed decisions** (choice / score / probability
— "noul") instead of generative prose. You don't ask it to *write* a review;
you ask bounded questions and branch on the answers.

```
  prose model:   "review this diff"        → essay, vibes, unparseable
  decision model: state + typed questions  → { correctness: 0.87,
                                               severity: 2, ... }
                                             → code branches on numbers
```

## The pieces

- **Jev** (TypeSafe AI) — the System One decision model. Send one `state`
  + up to ~8 typed questions; get a probability/label/level per question.
  `jev-use` is the official MIT SDK — `check()`/`judge()` calls.
- **Decision API** (decisionapi.org / decisionapi.net) — the multi-model
  workbench: `POST /v1/systemone` with `model` + `state` + `questions`.
  Hosts `typesafe/jev-1.13`, `upstage/solar-decide`, `jaredpalmer/kev-4b`,
  `liquid/d1`, `laya-*`, `openai/*-decisions`. Playground needs no key for
  model listing; keys are server-side only.
- **Ecosystem** — `jev-review` (staged review workflow + local dashboard,
  ~580★), `jev-agent-mcp` (`review_changes` MCP tool — judges a diff you
  hand it), `jev-pref` (lints changes against `jev-pref.json` preferences),
  `diffjury` (PR risk router), `awesome-jev` list.

## Why typed beats generative for gates

- **Thresholdable** — a probability is a number; `≥0.8 blocks` is a rule a
  pipeline can own. Prose verdicts need a second model to parse them.
- **Parallel + cheap** — bounded questions batch in one call; no essays.
- **Auditable** — the question IS the contract. Each constraint carries a
  self-contained predicate; vague predicates produce escalations, not
  verdicts.

## How this harness uses it (the gate's judge layer)

```
diff ──► deterministic layers (regex, schema, tests) ──► always run,
        cannot be vetoed by any model
        │
        └──► typed judgment (Jev): every constraint one call,
             0.8 threshold — only confirmed findings block
             │
             └──► persistent synapse state (state.json):
                  per-file rejection counts, recurring violation
                  types, open obligations — judges get smarter
                  across deploys; repeat-offender files get
                  looked at harder
```

Also `jev.mjs --spec <file>`: judge a *proposal* before code exists —
rejecting a bad idea is cheaper than rejecting a bad diff.

## Rules that keep it honest

- **Deterministic + judgment, never judgment alone.** Regex can't see
  intent; the model can't be trusted with facts. Facts gate always; the
  model layer can only *add* blocks, never lift them.
- **Missing key = advisory, loudly.** No credential → the model layer
  demotes to advisory and *says so* — a silent skip looks like "all clear"
  and is exactly the gray-failure pattern.
- **Judge the session, not just the diff.** The action ledger feeds the
  same review — what the agent *did* matters as much as what it wrote.
