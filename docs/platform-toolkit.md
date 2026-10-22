# The platform toolkit — ADRs, reusable workflows, Backstage/IDPs

Company-production level, not LivePair-specific. How each mechanism
actually works, and the honest "is there an all-in-one" answer.

## 1. ADR mechanics — how decisions actually live

An ADR is a **file, not a meeting**. Anatomy (MADR format, the common
standard):

```markdown
# ADR-0014: Use Vectorize for reference-asset retrieval

Status: accepted            ← proposed | accepted | deprecated | superseded
Context:                    ← what problem, what constraints forced a choice
  Need semantic search over user media; D1 can't do vectors; tenant
  isolation must be structural not application-level.
Decision:                   ← the ONE call being made
  Cloudflare Vectorize, namespace = "u:<userId>" — same key as D1 scope,
  so cross-tenant retrieval is impossible by construction.
Alternatives considered:    ← Pinecone (extra service+key), pgvector
                              (no PG in stack), flat D1 tags (no semantic)
Consequences:               ← good AND bad, honestly
  + zero new infra; − 1408-dim index caps at provider embedding dims;
  − Vectorize has no delete cascade → orphaned vectors on asset delete.
```

Rules that make it work:

- **Numbered + immutable.** Decided = locked. Changed mind → write
  ADR-0023 that says `Status: superseded by ADR-0023`, leave the old one
  standing. The log IS the history.
- Lives **in the repo** (`docs/decisions/` or `docs/adr/`) — diffs with
  the code that implements it, reviewable in the same PR.
- Size discipline: one screen. If it needs chapters, the decision isn't
  made yet — that's a spec.
- GDS/GOV.UK use exactly this shape (ADR-0018 Concourse migration is a
  real example: context → options tried → decision → consequences).
- Tools: `adr-tools` CLI (`adr new`, `adr link`), `log4brains` renders
  them as a browsable site — both are decoration; a folder of markdown
  files IS the system.

## 2. Reusable workflows — what's actually inside

The mechanism (`workflow_call` trigger):

```yaml
# central repo: platform/.github/workflows/standard-ci.yml
on:
  workflow_call:                    # ← makes it callable
    inputs:
      node-version: { type: string, default: "22" }
      run-deploy:   { type: boolean, default: false }
    secrets:
      deploy-token: { required: true }
    outputs:
      image-digest: { value: ${{ jobs.build.outputs.digest }} }

jobs:
  build:
    runs-on: ubuntu-latest
    outputs: { digest: ${{ steps.build.outputs.digest }} }
    steps:
      - run: <the actual standard — lint, test, build, scan>
```

```yaml
# every product repo consumes it — 4 lines, zero drift
jobs:
  ci:
    uses: platform/repo/.github/workflows/standard-ci.yml@main
    with: { run-deploy: true }
    secrets: { deploy-token: ${{ secrets.DEPLOY_TOKEN }} }
```

What it buys over copy-paste: the standard lives in **one file**, every
repo inherits edits instantly, and `secrets:` are passed explicitly —
each repo can't silently weaken the gate. GOV.UK runs shared workflows
from `alphagov/govuk-infrastructure` (brakeman, rubocop, standardx) —
hundreds of repos, one definition. Related primitives: **composite
actions** (share steps, not whole jobs), **required workflows** (org
enforcement — GitHub Enterprise can mandate a workflow on every repo),
**branch rulesets** (required status checks).

## 3. The "all-in-one" question — answered honestly

**Yes, the category exists: Internal Developer Platforms (IDPs).**

| Option | Shape | Reality |
|---|---|---|
| **Backstage** (Spotify, CNCF OSS) | self-hosted portal: service catalog + software templates + TechDocs + scorecards + 200+ plugins | the industry default; real ops cost (Node app + DB + config per plugin) — pays off ~>20 engineers, pain below |
| **Port / Cortex / OpsLevel / Roadie** | SaaS IDPs — same concepts, managed | faster start, $$, vendor lock on your catalog data |
| **DIY minimum** | mkdocs + ADRs + reusable workflows + a status page | what 90% of teams under 50 actually run — the GDS stack minus the portal |

So: Anthropic builds custom because scale; normal companies either buy an
IDP SaaS or run the DIY-minimum. The disciplines (ADR/RFC/runbook/gate)
don't require Backstage — Backstage just puts a UI on them.

## 4. Backstage internals (the employment-relevant bits)

- **`catalog-info.yaml`** per repo — the unit of truth: name, owner,
  type, lifecycle, dependencies, links to dashboards/runbooks. Catalog
  = these YAMLs aggregated.
- **Software templates** — `template.yaml` + skeleton dir + fetch/
  publish actions → "New Service" button that scaffolds a repo with
  standards baked (CI file, catalog-info, README, lint config).
- **TechDocs** — mkdocs inside each repo, rendered in the portal.
- **Scorecards/tech-insights** — readiness checks as data (has oncall?
  has runbook? CI green? deployed < 30d ago?).
- Interview vocabulary: "internal developer platform", "golden path",
  "service catalog", "scorecards" — Backstage is the reference impl.

## 5. AGENTS.md split — the standard, concretely

Codex's implemented model: concatenate every AGENTS.md on the path
root→cwd, deeper overrides. Applied to a realistic monolith:

```
/AGENTS.md                 ← identity, hard bans, gate law, registry
/apps/web/AGENTS.md        ← routes, session resolver, UI conventions
/server/AGENTS.md          ← api/money/webhook rules
/ops/AGENTS.md             ← deploy lane, gates, canaries
/docs/incidents/           ← one file per burn (root links index only)
```

Rules: root ≤100 lines, subtree ≤150, incidents unbounded (loaded on
demand). A session touching only `server/` never pays the web/ops/doc
tax — and the file can't rot into a second wiki because each layer has
a hard budget. Templates: `templates/agents/` in this repo.
