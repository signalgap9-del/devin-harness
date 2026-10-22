# Building a GDS-style engineering system — the join-a-company playbook

Everything GOV.UK/GDS publishes is reproducible with OSS. The stack and
the order to build it in. Verified Oct 2026.

## The component map — what GDS has vs the OSS that builds it

| GDS piece | What it does | The framework/tool |
|---|---|---|
| **The GDS Way** | engineering standards site — how we build/run, all public | `mkdocs-material` or `docusaurus` static site; GDS Way itself is a Middleman repo (`alphagov/gds-way` — forkable as a template) |
| **ADRs** | every architecture decision recorded (`govuk-infrastructure/.../decisions/0018-use-concourse-ci.md`) | `adr-tools` (npryce), **MADR** template, `log4brains` (renders ADRs as a site) |
| **RFC repo** | proposals before big changes (`alphagov/govuk-rfcs`, RFC-123 chose GH Actions) | just a public repo + markdown + PR review = the RFC process itself |
| **Runbooks** | `docs/runbooks/*.md` — per-alert/incident steps | playbook skeleton in `oncall-playbooks.md` here |
| **Dev manual** | `docs.publishing.service.gov.uk` — deployments, pipelines, gotchas | same static-site tooling; content is discipline not tech |
| **Shared CI workflows** | reusable `ci.yml` across 100s of repos (`uses: alphagov/.../brakeman.yml@main`) | **GitHub Actions reusable workflows / composite actions** — the mechanism that makes one standard run everywhere |
| **Env promotion + freeze flags** | helm-repo image_tag = truth; `automatic_deploys_enabled` as a versioned flag | ArgoCD + Helm values; or env config in git for non-K8s |
| **Release dashboard** | "Release" app — what version is where | Backstage catalog + simple status page; or Datadog deployment tracking |
| **PR review culture** | documented review guidelines (public in gds-way) | markdown doc — the discipline is the artifact |

## Adjacent frameworks worth knowing

- **Backstage** (Spotify OSS) — internal developer portal: service
  catalog + scorecards + **software templates (golden paths)** — the
  "spin up a new service with our standards baked in" machine.
- **projen / cookiecutter** — repo scaffolding with standards baked in
  (lint config, CI file, LICENSE, README shape come free).
- **OpenRewrite / codemods** — push a standard as *code transforms*
  (e.g. upgrade every repo's CI pattern), not a wiki plea.
- **Danger.js / commitlint / policy bots** — PR-time convention checks
  (title format, changelog required, big-diff warnings).
- **Keep a changelog / changesets / release-please** — the release-notes
  automation behind their "release notes + semver" mandate.

## Build order when you join a company

```
1. doc site skeleton        — mkdocs; empty is fine, it grows
2. ADR convention           — first ADR: "we record decisions as ADRs"
3. pipeline truth           — one file/UI saying what's deployed where
4. reusable CI workflow     — the standard becomes a workflow ref,
                              not a wiki page people ignore
5. runbook template + first entries — written during real incidents
6. freeze/approval mechanics — a flag or environment rule, in git
7. standards docs            — write them as you enforce, not before
```

The pattern underneath: **every standard is either code (workflow,
policy, template) or a versioned doc — never a wiki that rots and never
a rule that lives in someone's head.** That's the whole GDS trick; the
specific tools are interchangeable.

## Why this is the interview asset

"I built the engineering-standards layer" = a real role (dev
productivity/platform eng). The portfolio answer isn't "read GOV.UK docs"
— it's this repo: the same component map, implemented for a running
product, with the sources cited.
