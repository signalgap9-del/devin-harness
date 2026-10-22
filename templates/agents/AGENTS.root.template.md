# AGENTS.md — <project name>

> Root rules. Everything here must be true EVERYWHERE. Subtree
> AGENTS.md files add scope-specific rules; docs/incidents/ holds the
> burn log. Keep this file ≤100 lines — rules that only apply to a
> subtree live in that subtree's AGENTS.md.

## Identity

- <one line: what this product is, who it serves>
- <one line: the single non-negotiable product fact (e.g. multi-tenant)>

## Hard bans (never, anywhere)

- Never delete/destroy: <projects, credentials, applied migrations,
  user data> — cleanup is owner-only.
- Never expose secrets to clients, logs, commits, or public surfaces.
- Never bypass the deploy gate: <the ONE deploy command>; raw
  <deploy tool> commands are blocked by hooks.
- Never weaken the bar: no @ts-ignore/eslint-disable, no skipped or
  deleted tests, no stripped assertions, no unimplemented stubs.
- Tenant isolation is structural: every user-owned object is scoped by
  server-resolved identity — never a client-supplied scope.

## Gray-failure law

Operator-visible health must equal user-visible health. "200 OK" or
"admin works" never proves a user path. Claim only what was verified:
say "verified through step X" or "unverified beyond X". Silent
.catch/skip on user/money/alert paths is a defect.

## The gate

- Deploys go through `<deploy command>` — it runs <N> stages including
  typed judgment and post-deploy canaries. A green gate is the only
  "shippable" signal.
- Baseline checks before claiming done: `<test cmd>`, `<check cmd>`,
  `<typecheck cmd>`.

## Secret registry (names only — never values)

- Prod: <names>
- Local env files: <paths>
- Missing-locally list: <names that only exist in prod>

## Pointers

- Incidents/burns: `docs/incidents/` — read the index, not this file.
- Deploy lane details: `ops/AGENTS.md`
- <app subtree>: `apps/<x>/AGENTS.md`
