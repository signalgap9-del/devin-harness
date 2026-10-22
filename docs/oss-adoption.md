# OSS adoption index — every tool named, where it stands

The stockpile: every OSS tool surfaced across this whole research pass,
in one auditable list. Status column: **ADOPTED** (file in this repo) /
**READY** (pull command documented, opt-in) / **DEFERRED** (adopt on
trigger) / **NO** (evaluated — don't).

Rule stays: use the maintained tool; hand-roll only what it can't do.
`oss-stack.md` = the deep-dive picks; this = the complete inventory.

## Agent hooks & lifecycle

| Tool | Repo | What it covers | Status |
|---|---|---|---|
| claude-code-hooks (karanb192) | `karanb192/claude-code-hooks` — MIT, ~550★ | 10 ready hooks: bash-guard, protect-tests, context-snapshot, rules-injector, session-summary, cost-tracker, notifications + plugin marketplace | READY — `/plugin marketplace add karanb192/claude-code-hooks` (Claude Code); vendor hook scripts into other harnesses |
| claude-code-blueprint (Aedelon) | `Aedelon/claude-code-blueprint` | 11 hooks across 9 lifecycle events — session-start/end, user-prompt-secrets, bash-guard, bash-vuln (npm audit), stop summary, pre-compact; fail-closed | READY — vendor per-need |
| cc-session-tools | `raffishquartan/claude-code-session-tools` | Installable hook lib: telemetry.db (SQLite ledger), confirm_8digit guard, command cache | READY — `uv tool install cc-session-tools` |
| claude-hooks (decider) | `decider/claude-hooks` | lint/format/quality gates as hooks | READY |
| awesome-claude-code-hooks | `ithiria894/awesome-claude-code-hooks` | curated index of the whole hook ecosystem | REFERENCE — start here when looking for a hook |
| shanraisshan/claude-code-hooks | `shanraisshan/claude-code-hooks` | all-30-event working reference (event catalog + changelog) | REFERENCE |
| claude-session-hooks-template | `johnlindquist/claude-session-hooks-template` | TS templates w/ correct JSON I/O per event | REFERENCE |
| Our `ops/verify/*.mjs` | this repo | repo-specific payloads only: our ledger format, state.json obligations, GCP/deploy rules no OSS knows | KEPT — generic needs → pull from karanb192/blueprint first |

## Official lab repos

| Tool | Repo | Status |
|---|---|---|
| claude-code-action | `anthropics/claude-code-action` | READY — PR-level agent reviews in CI |
| claude-code-security-review | `anthropics/claude-code-security-review` | READY — security review action |
| anthropics/skills | `anthropics/skills` | REFERENCE + vendor source |
| anthropics/claude-cookbooks | `anthropics/claude-cookbooks` | REFERENCE — patterns |
| openai/codex | `openai/codex` | REFERENCE — the AGENTS.md layering impl + app-server pattern |
| graphify | `safishamsi/graphify` — Apache-2.0 | READY — `uv tool install graphifyy` + `graphify install`; optional code-graph layer, see `context-engineering.md` |
| impeccable | `pbakaus/impeccable` — Apache-2.0 | READY — `npx impeccable install`; design-quality CLI + `--json` CI gate |
| pstack / open-pstack | `poteto` (Cursor) / `ericlitman/open-pstack` (Claude/Codex, MIT) | READY — `/plugin marketplace add ericlitman/open-pstack` + `/plugin install pstack@open-pstack`; 50+ workflow skills (how/why/architect/arena/unslop/reflect/automate-me). Alt: `michael-denyer/pstack-claude` (adds cursor-team-kit imports + SessionStart auto-fire) |
| agent-skills (Osmani) | `addyosmani/agent-skills` — MIT, ~109k★ | READY — `npx skills add addyosmani/agent-skills`; 24 SDLC skills + /spec→/plan→/build→/test→/review→/ship commands, 70+ agent targets. Overlap note: our verify-with-sources/quality-judge cover part of it — install for the workflow phases we lack |
| jev-use + Decision API | npm `jev-use@0.8.0`, decisionapi.org | ADOPTED in livepair gate (`ops/verify/jev.mjs`) |
| jev-review / diffjury | ecosystem | DEFERRED — needed when agent-diff volume outgrows human review |

## VCS, review & merge

| Tool | Status |
|---|---|
| `facebook/sapling` | DEFERRED — trigger: repo scale/merge volume where Git hurts |
| `jj-vcs/jj` | READY — try locally anytime; stacked-change + `jj undo` |
| Gerrit | DEFERRED — the Antique-class review surface; trigger: diff volume |
| `ezyang/ghstack`, `ejoffe/spr` | READY — stacked PRs on GitHub today |
| Mergify / Bors / Kodiak | DEFERRED — merge queues matter with multiple contributors; also native GH merge queue |
| `gitleaks` | **ADOPTED** — `.github/workflows/gitleaks.yml` scans every push/PR |

## CI/CD & release orchestration

| Tool | Status |
|---|---|
| Buildkite | DEFERRED — SaaS; trigger: multi-repo agent pipelines at volume |
| Dagger | READY — portable CI-as-code |
| Bazel / Nx | DEFERRED — monorepo cache/selection; trigger: build time |
| Temporal | DEFERRED — durable workflows; trigger: long multi-step ops (incident flows) |
| ArgoCD + Argo Rollouts / Flagger | DEFERRED — needs K8s; trigger: k8s adoption |
| Spinnaker / Octopus / Harness / GitLab | DEFERRED — enterprise CD; cataloged in `release-orchestration.md` |
| projen / cookiecutter | READY — project scaffolding alt to `setup.mjs`; evaluated — setup.mjs keeps repo-injection semantics cookiecutter lacks, but pull if bootstrapping NEW projects |

## Secrets & security

| Tool | Status |
|---|---|
| Infisical (+ Agent Vault) | DEFERRED — trigger: secrets shared across team/agents |
| HashiCorp Vault | DEFERRED — enterprise scale |
| SOPS + age | READY — file-level secret encryption in-repo today |
| semgrep | READY — SAST in gate; add to CI when rule coverage needed |
| osv-scanner / npm audit | READY — dep CVE scan; add as CI step |

## Observability & on-call

| Tool | Status |
|---|---|
| OpenTelemetry | READY — trace/metric SDK when a real service exists to instrument |
| Prometheus + Alertmanager + Grafana (+Loki/Tempo) | DEFERRED — needs always-on infra; trigger: k8s/VM estate |
| Sentry | READY — drop-in error tracking anytime |
| Keep (keephq) | DEFERRED — alert correlation at alert volume |
| GoAlert / IncidentRelay | DEFERRED — on-call rotation when on-call is a real job |
| Grafana OnCall OSS | **NO** — entered maintenance/archive; pick GoAlert/incident.io instead |
| Sentry / Better Stack / UptimeRobot | READY — external probe layer |

## Flags & experimentation

| Tool | Status |
|---|---|
| Unleash / Flagsmith / OpenFeature | DEFERRED — trigger: flags outgrow env vars/KV (livepair uses KV caps — documented local equivalent) |
| GrowthBook | DEFERRED — experimentation program trigger |

## Contracts, tests & repo hygiene

| Tool | Status |
|---|---|
| Pact / Pact Broker | DEFERRED — trigger: multiple services whose APIs can drift |
| Danger.js | READY — PR hygiene checks in CI |
| OpenRewrite | DEFERRED — codemods; trigger: org-wide standard migrations |

## Platform, docs & process

| Tool | Status |
|---|---|
| mkdocs-material | **ADOPTED** — `mkdocs.yml` renders all of docs/ |
| Backstage | DEFERRED — IDP; trigger ~10+ services (see `platform-toolkit.md`) |
| Docusaurus / TechDocs | READY — docs-site alternatives |
| adr-tools / MADR | READY — `npx adr init`; our `templates/decisions/` is the dependency-free version |
| log4brains | READY — `npx log4brains init`; ADRs as a rendered site |
| GitHub reusable workflows / rulesets | READY — native, no install; patterns in `platform-toolkit.md` |

## Government reference implementations

| Repo | Status |
|---|---|
| `alphagov/gds-way` | REFERENCE — standards-site source (forkable Middleman repo) |
| `alphagov/govuk-ai-accelerator` | REFERENCE — baseline-comparison harness for AI output (our canary pattern) |
| `alphagov/govuk-infrastructure` | REFERENCE — the real public deploy pipeline (Argo Workflow → ArgoCD) |
| `alphagov` RFC repos | REFERENCE — public decision process |

## Evaluated → NO

| Tool | Why |
|---|---|
| Grafana OnCall OSS | maintenance/archived — don't build on it |
| Gitflow | abandoned by its author; GitHub flow / TBD won |
| MemT | research model, no OSS release — adopt the experience-bank *pattern* (`agent-memory.md`), not the model |
