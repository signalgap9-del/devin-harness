# Production methodologies — how regulated/standard companies ship

Every claim linked to canonical sources. Oct 2026 verified.
We deploy straight from a session today; this is the delta between that
and what finance/enterprise shops require — and how much of it our
harness already automates.

## 1. Branching & integration model

| Method | What it is | Who prescribes it | Link |
|---|---|---|---|
| **Trunk-based dev** | integrate to `main` ≥ daily; short-lived branches; unfinished work behind **feature flags**, not branches | minimumcd.org migration guide; HMCTS standards ("git-flow not recommended, even by its author") | https://beyond.minimumcd.org/docs/foundations/trunk-based-development/tbd-migration/ , https://hmcts.github.io/standards/practices/branching.html |
| **GitHub flow** | branch → PR → CI green → merge → deploy; "main is always shippable" | UK Defra standards (default for UK gov services) | https://defra.github.io/software-development-standards/guides/developer_workflows/ |
| **Gitflow** | long-lived `develop`/`release`/`hotfix` branches | legacy enterprise; original author himself disavows it now | https://nvie.com/posts/a-successful-git-branching-model/ |
| **Release branches as tags** | cut at release time from trunk, cherry-pick fixes back | HMCTS | same URL above |

**Regulated-industry nuance** (from minimumcd TBD guide): direct-to-trunk
is fine for unregulated; **SOX/HIPAA/FedRAMP shops use Path 1 —
short-lived branches + PRs** because they need audit trails, separation
of duties, and documented approvals. Our model today = trunk commits
with gate enforcement — the harness gate IS the approval trail.

## 2. Environment promotion pipeline

The standard shape (AWS prescriptive guidance + Microsoft engineering
playbook):

```
  dev → test/integration → staging/UAT → production
         (suite gate)     (prod-like,    (approval step,
                          sign-off)      same artifacts,
                                         least privilege,
                                         read-only devs)
```

Canonical sources:
- AWS "Choosing a Git branch approach" — prod env spec:
  https://docs.aws.amazon.com/prescriptive-guidance/latest/choosing-git-branch-approach/production-environment.html
- Microsoft code-with engineering playbook — continuous delivery,
  environment promotion, UAT sign-off criteria:
  https://github.com/microsoft/code-with-engineering-playbook/blob/main/docs/CI-CD/continuous-delivery.md

Key rules from these: **same artifacts flow through every env** (never
rebuild for prod), production dev access = read-only + audited exception,
deploys gated by approval step, DB versioning as its own step.

### Who enforces it — the system, not the doc

Promotion rules aren't "policy people agree to" — each has a mechanical
enforcer:

| Rule | Enforced by |
|---|---|
| same artifact, never rebuild | artifact registry — deploys pin a digest/SHA, so "what was tested" IS "what ships" |
| approval before prod | GitHub Actions environments (required reviewers + protected branches), Buildkite block step, ArgoCD manual sync, Spinnaker judgment stage |
| devs read-only in prod | IAM split — the pipeline's OIDC role deploys; humans hold viewer roles; secrets exist only in env-scoped stores |
| DB versioning separate | its own pipeline stage (migration job), never bundled into app deploy |
| elevated access audited+expiring | AWS SSO entitlements / Teleport-style grants — approval + auto-expiry + full log |

**Our version today:** the gate runs locally and deploy keys live
locally. One step to platform-enforced: GitHub Actions `environment:
production` + required reviewer + prod secrets scoped to that
environment → "no deploy without sign-off" becomes physics. Add
`wrangler versions` traffic % on top and that's the AWS model adapted
to a Workers stack.

## 3. Change management (the ERP/finance world's spine)

| Concept | What it is |
|---|---|
| **CAB / change advisory** | humans approve risky changes before prod — our deploy gate is the automated version |
| **Separation of duties** | author ≠ approver ≠ deployer — for us: agent authors, gate judges, ledger records (approximation) |
| **Change freeze windows** | no deploys during close/settlement/peak — we have none; worth a gate rule |
| **Audit trail** | every change traceable to ticket+approver+result — our ledger covers the evidence side |
| **ITIL change types** | standard (pre-approved low-risk) / normal (CAB) / emergency — map: routine deploys = standard lane |

## 4. Release discipline

- **Release trains** (SAFe): fixed cadence, changes board the train or
  wait — https://scaledagileframework.com/
- **Freeze windows** + **soak time** in staging before promotion.
- **DORA four keys** (deployment freq, lead time, change-fail rate,
  MTTR) — https://dora.dev — the industry health scorecard.
- **Error budgets** (Google SRE ch. 3 release engineering + SLO book) —
  https://sre.google/sre-book/release-engineering/ ,
  https://sre.google/workbook/implementing-slos/
- **Progressive delivery** — canary % → the release-engineering.md gap.

## 5. What the labs-vs-enterprise split looks like

```
  Enterprise (ERP/finance):      Labs (Anthropic/OpenAI):
  ─────────────────────────      ─────────────────────────
  branch+PR per change           agent lands via merge queue
  CAB approval                   gate + typed judgment + canary
  env promotion dev→uat→prod     same artifacts, % rollout
  freeze windows                 deploy serialization (lock)
  audit trail (SOX)              action ledger (same idea)
  separation of duties           deterministic guards (non-bypassable)
```

Left column is what ERP interviewers expect to hear; right column is
what the agent-era converts it into. Our harness already sits in the
right column — the docs exist so you can *speak* the left column.

## 6. Frontier Academy — what it actually is

Anthropic's Oct 2, 2026 announcement: **$100M committed to train 10,000
"Frontier Deployed Engineers" by end of 2027** — partner cohorts
(Accenture, Bain, Capgemini, CBA, Deloitte, McKinsey, Morgan Stanley,
Novo Nordisk) trained to Anthropic's internal engineering standard for
deploying agents at enterprises. Translation: Anthropic is productizing
*the skill of running agentic engineering inside companies* — i.e.,
what this repo documents is literally the discipline they sell.
Link: https://www.anthropic.com/news/claude-frontier-academy

## 7. Source collection (the URL shelf)

- TBD migration (regulated envs): https://beyond.minimumcd.org/docs/foundations/trunk-based-development/tbd-migration/
- HMCTS branching standard: https://hmcts.github.io/standards/practices/branching.html
- Defra dev workflows: https://defra.github.io/software-development-standards/guides/developer_workflows/
- AWS branch-approach guidance: https://docs.aws.amazon.com/prescriptive-guidance/latest/choosing-git-branch-approach/
- MS engineering playbook: https://github.com/microsoft/code-with-engineering-playbook
- Google SRE book (free): https://sre.google/sre-book/table-of-contents/
- SRE workbook (SLOs): https://sre.google/workbook/table-of-contents/
- DORA capabilities: https://dora.dev/capabilities/
- SAFe: https://scaledagileframework.com/
- Original GitFlow (historical): https://nvie.com/posts/a-successful-git-branching-model/
- Anthropic engineering index: https://www.anthropic.com/engineering
- OpenAI engineering index: https://openai.com/news/engineering/
- Codex blog index: https://developers.openai.com/blog/topic/codex
