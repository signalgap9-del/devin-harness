# Testing strategy — what tests cover vs what judgment covers

"Can't tests + CI replace the typed-judgment model?" No — they check
different axes, and conflating them is how agent-driven repos rot.

## The division of labor

```
  tests       = assertions about behavior YOU thought to specify
                "charge(100) returns receipt" — deterministic, true forever
  typed judge = questions about properties NOBODY wrote a test for
                "does this diff do something unasked-for?" — probabilistic
```

- **Tests can't see scope.** A test suite passes happily on a diff that
  also refactored three unrelated files — nothing asserts "only what was
  asked". The judge's `unrequested_scope` question does.
- **Tests can't see the bar being lowered.** A deleted test, a new
  `@ts-ignore`, a stripped assertion all pass the suite — the suite IS
  what was weakened. `weakened_bar` watches the tests themselves.
- **Judgment can't verify behavior.** A 0.8-probability verdict is not a
  proof. Correctness still needs deterministic tests; the judge adds
  blocks, never replaces them.
- **Deterministic layers can't be vetoed.** Model says "fine" → regex
  finding still blocks. Facts outrank opinions in both directions.

## Test taxonomy for agent-written code

Ordered by cost-of-failure, not by the pyramid — for a SaaS gate:

| Layer | What it proves | Examples here |
|---|---|---|
| **Invariant tests** | money/tenant math can't lie | ledger `Σdelta == balance`, `useRefs` never overwrites explicit media (`pickRefInputs`) |
| **Contract tests** | provider APIs still behave | WaveSpeed catalog sync `--check`, auth canary probing the real OAuth URL |
| **Authz tests** | tenant B can't see tenant A | `GET /references` → 401 unauth; search scoping |
| **Regression tests** | a fixed bug stays fixed | one per incident, named for the failure |
| **Canary checks** | prod path works end-to-end | post-deploy probes — these ARE tests, run against reality |

Rule: **write the failing test first** for any bug fix. The test is the
reproduction; a fix without it is a claim, not a repair.

## Writing conventions (agent-readable)

- **Name the invariant, not the function**: `references never overwrite
  explicit attachments` > `testPickRefInputs`. A judge/reviewer reads the
  name to know which contract broke.
- **One assertion per behavior**, not per function — a test asserting five
  things gives five failures to triage as one.
- **No unmocked network in unit tests**; contract tests own the network
  and are marked as such.
- **Flaky test = failing test.** Quarantining is a defect until fixed;
  a suite you don't trust is worse than none.
- **New path → new canary.** Any user/money route that can die without a
  5xx gets a post-deploy probe in the same diff.

## CI/CD framework note

The framework isn't GitHub Actions vs Buildkite — it's **where checks
live**. Ours live in the deploy lane itself (`ops/verify/*`), which means
the gate is identical locally and in CI: same scripts, same order, same
failure semantics. Whatever CI platform runs `npm run deploy` inherits the
whole gate for free — that's the portability win, not the YAML.
