# Release orchestration — who sells the finished machine

"Where's the complete implementation?" It's a product category called
**release orchestration** — the layer that runs *after* CI ends. Verified
Oct 2026.

## The finished products (what banks/governments actually buy)

| Product | What it is | The compliance goods |
|---|---|---|
| **Octopus Deploy** | the classic enterprise CD orchestrator — release versioning, env promotion beyond dev/test/prod, progressive delivery, runbooks, deployment freezes, multi-tenant releases. 800+ financial institutions, 8M deploys/yr | built-in audit logs + RBAC + **deployment lifecycles (env progression enforced mechanically)** + Config-as-Code (deploy process itself in git) + ITSM/SIEM streaming to Splunk/Datadog |
| **GitLab (Ultimate/Dedicated)** | single DevSecOps platform — compliance pipelines, merge trains, audit-ready evidence generated automatically, self-managed or single-tenant SaaS | security scans in the same pipeline + evidence mapped to control frameworks |
| **Azure DevOps** | Microsoft's enterprise suite — pipelines + environments + approvals + boards | the default in Windows/finance shops |
| **Harness** | CD platform with **governance-as-code (OPA policies)** — rules enforced by policy engine, not checklists | policy violations block deploys |
| **CloudBees/Jenkins, Spinnaker** | heavyweight legacy + Netflix OSS multi-cloud CD | — |
| **ServiceNow DevOps** | the CAB connector — pipeline changes create/link real change requests in the ITSM | deploy literally requires an approved change ticket |

CI tools (Actions/GitLab CI/Jenkins/Buildkite) end at "green build".
Orchestration starts there: promote, approve, freeze, audit, roll back.

## Reference architecture — GOV.UK's actual pipeline (public docs)

The UK government's real, running system — documented at
docs.publishing.service.gov.uk (manual/deployments, ADR-0018, RFC-123):

```
PR merged → GitHub Actions: build image → GitHub Container Registry
        │
        ▼   release tag v<N> stamped
Argo Workflow (deploy-image)
        │
        ▼   updates image_tag in govuk-helm-charts repo (source of truth)
ArgoCD ──► Integration env ──► smoke tests ──► [promote_deployment?]
        │                                    │
        ▼                                    ▼
      Staging ──► smoke ──► Production ──► smoke
```

Notable mechanics:

- **Deployment freeze is a config flag** — `automatic_deploys_enabled`
  per app, flipped during e.g. elections. Freeze = a value in the Helm
  chart repo, i.e. *itself version-controlled*.
- **Image tag in the chart repo = the truth** of what's deployed where;
  the "Release" app renders it as a dashboard.
- Promotion gates on smoke tests per env, not human memory.
- Their own pipeline docs are public enough to clone the pattern.
- (They're mid-migration off Argo Workflows toward Concourse per
  ADR-0018 — even governments refactor their CI.)

## The split that matters for interviews + for us

```
  CI (build/test)      ──►   CD/orchestration         ──►   governance
  Actions, GitLab CI        Octopus/ArgoCD/Harness           OPA, ITSM,
  "is it green?"            "does it move between envs?"     "may it move?"
```

Orchestration ≠ more YAML in the CI file — it's the control layer that
decides *whether* a green artifact may advance, who approved, and what's
frozen. Our deploy gate + canaries + deploy-lock are a single-lane
version of exactly this; the env-promotion lane (staging/UAT) is the
known gap in `release-engineering.md`.
