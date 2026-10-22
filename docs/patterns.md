# Patterns

Doctrine harvested from real production burns. Each item: the failure that
taught it, then the rule.

## Gray failures

*Burned:* the site served HTTP 200 for hours while Google returned
`deleted_client` — zero signups, nothing paged, found via a user report.

- **Operator-visible health must equal user-visible health.** "Working" =
  the stranger's journey completes, not a 200.
- **Fail-soft must fail loud.** `.catch(() => {})` / "best-effort" / silent
  skip on a user-facing, money, or alert path is a defect unless it logs
  loudly or pages. Alert channels that can die silently *are themselves*
  the silent failure (an SMS provider fallback chain needs per-channel
  failure logs, not just a last-resort scream).
- **Canary over uptime.** Deploy checks probe the real journey (auth URL
  resolves, webhook verifies, judge lanes answer) — add one whenever a path
  can die without a 5xx.
- Console-only third-party state has no API — never claim it's correct;
  flag manual-check items instead.

## Single points of failure

*Burned:* a provider silently removed one vision model from its catalog;
every image-input generation returned 422 and nothing noticed, because the
judge call swallowed its own error into a `null`.

- A hard-coded single model/provider on any user-facing path is a defect.
- Fallback lanes should cross **providers**, not just model names — same
  provider = same outage.
- Every lane logs loudly (provider, model, HTTP status, truncated body).
- Scheduled probes + a deploy-time canary — the lane dies, you hear about
  it in minutes, not from a user.
- Fail-closed stays for safety checks (a dead judge must block, not wave
  through) — but "all lanes dead" must be the *only* blocker, not "one lane
  dead."

## Pipelines that can't hang

*Burned:* a deploy gate child fetched a provider API with no timeout; the
gate parked forever and looked like a slow deploy.

- Every upstream fetch gets `AbortSignal.timeout`.
- Every gate-runner child gets a process timeout ceiling.
- Fail-closed is fine — a hung check *fails* the deploy — but it must fail,
  not wait.

## Money paths

- Payment/fulfillment is idempotent on a reference id; a cron reconciler
  re-queries provider truth for stale pendings.
- Ledger invariants get audited on the sweep (Σdeltas == balance).
- Silent catches on refund/grant paths are doubly dangerous — the ledger
  loses its only recovery handle.

## Tenant isolation

- Every state is owned: rows, files, vector namespaces, sessions.
- Server enforces the owner scope; client-supplied owner/filter is never
  trusted.
- The cleanest version is *structural*: the tenant key IS the namespace/
  path, so cross-tenant reads are impossible rather than filtered.

## Deterministic enforcement

- Rules agents keep forgetting become hook regexes (`agent-guard.mjs`) —
  <50ms, no model call, can't be argued with.
- The action ledger (`agent-ledger.mjs`) makes session behavior auditable —
  a gate judge can review *what the agent did*, not only the diff.
- LLM-judged diffs complement, never replace, the deterministic layer:
  regexes for known-bad shapes, judgment for everything else.
