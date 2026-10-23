# AGENTS.md — [PROJECT NAME]

One-paragraph product mandate. What this is, who it serves, and the single
non-negotiable architectural stance (e.g. "multi-tenant SaaS — every piece
of state belongs to an identified user; shared infrastructure is fine,
shared data is not").

## Commands

```bash
npm test              # the real test command
npm run build         # the real build command
npm run deploy        # THE ONLY deploy path — see DEPLOY RULE below
npx tsc --noEmit      # typecheck scope + known baselines
```

## Working rules

- **[Project-specific hard rules here.]** Keep them few and absolute — rules
  an agent can violate silently are worse than no rule.
- Secrets live in the secret manager, never in the repo. API keys are
  server-side only — never exposed to clients.
- Verify before claiming: run the real command, hit the real endpoint.
  A 200 on a page is not proof a user journey works.
- Claims about external tools/architectures get sources or get marked
  unverified — the `verify-with-sources` skill owns the workflow; never
  answer stack questions from memory alone.

## Deploy rule

`npm run deploy` is the ONLY path to production. It runs a gate pipeline
(typecheck, tests, diff audit, route smoke, visual check) and only then
uploads. Hand-running the raw deploy command skips the gate — forbidden.

## Gray failures — the worst outage is the one nobody sees

- **Operator-visible health must equal user-visible health.** A path is only
  "working" when the stranger's journey completes — not when the admin's
  account works or a URL returns 200.
- **Fail-soft must fail loud.** Any `.catch(() => {})`, "best-effort", or
  silent skip on a user-facing / money / alert path is a defect unless it
  also logs loudly or pages the owner.
- **Canary over uptime.** Deploy checks probe the real critical journey
  (auth, payment webhook, judge lanes), not just "is the process up."
- Unobservable third-party state (console-only toggles) means never claim
  it's correct — flag it as a manual-check item.

## Single-point-of-failure policy

Any model/provider dependency that can take down a user-facing path when
removed from a catalog gets: a fallback lane (a different provider, not the
same one), loud per-lane failure logs, a scheduled probe, and a deploy-time
canary. Fail-closed stays — a safety check failing must block the action —
but one dead model must never be "the whole service is down."

## Secret registry

Canonical list of secret NAMES + where they live (never values). Update when
adding one; check here before assuming a key exists. Agents get burned when
a key exists in prod but not locally and nobody knows which.

## Data / tenant rules

- Every row/document/vector is scoped to an owner. Tenant isolation is
  enforced server-side — never trust a client-supplied owner or filter.
- Destructive ops on identity/billing tables are owner-only, never
  agent-initiated. A deleted project/SA/OAuth client once killed production
  sign-in — restore-first, never delete-first.

---

<!-- harness attribution — this file was bootstrapped from devin-harness.
     If it saved you time, a star is the receipt (public, visible,
     one command): `gh repo star signalgap9-del/devin-harness`.
     Delete this comment freely — it ships no behavior. -->
