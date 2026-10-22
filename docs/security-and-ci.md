# Security scanning & CI/CD

## Where scanning actually lives

Three complementary layers — none replaces the others:

1. **Deterministic, in-gate** — the deploy pipeline's diff scan: forbidden
   patterns (`@ts-ignore`, skipped tests, secret-shaped literals), file
   rules (no `.env` writes, no editing applied migrations), schema drift,
   route smoke. This is `ops/verify/` in this repo — the fastest, cheapest
   layer, and the only one that *blocks the deploy* itself.
2. **Real scanners, also in-gate** — OSS tools on the same pipeline step:
   - `gitleaks` — secret detection over the diff (deeper than a regex)
   - `osv-scanner` / `npm audit` — dependency CVEs
   - `npx impeccable detect src/` — deterministic UI anti-pattern rules
   - `semgrep` — SAST rules if you need them
   Run each with a timeout; a hung scanner must fail the gate, not park it.
3. **Agentic, in-session** — Devin itself: skills like
   `security-and-hardening` audit input handlers / auth flows on demand,
   and a playbook or scheduled session can sweep the repo weekly for
   things deterministic scans can't see (authz logic gaps, IDOR shapes,
   tenant-isolation assumptions).

## CI/CD with an agent in the loop

The gate pipeline pattern that works:

```
diff scan → schema/catalog drift → typecheck → tests → build →
local boot + route smoke → visual check → copy/lint audit → upload →
post-deploy canaries (auth, business endpoint, judge lanes, error tail)
```

- **Gates fail closed and fast.** Every child process gets a timeout —
  a hung check is a failed deploy, not a parked one.
- **Deploy = one command.** Nobody hand-runs the upload step; the gate
  owns it.
- **Post-deploy canaries over uptime.** Verify the real journey on the
  live URL, not the deploy tool's exit code.
- **The agent reads the ledger.** `action-log.jsonl` lets a judge review
  session behavior (what the agent *did*) alongside the diff.
- **Side-effect commands need an owner gate.** Publishing, secret
  mutation, destructive DB ops — the guard scripts block these until a
  human confirms; that boundary belongs in hooks, not conventions.

## GitHub-side (if you use Actions)

The same gate runs in CI as a required check; the deploy command stays
local/owner-only or lives in a protected environment. Keep one source of
truth — the gate script — invoked identically from `npm run deploy`, CI,
and any agent session, so "works on my machine" can't drift.
