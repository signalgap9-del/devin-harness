# Production readiness model — what the harness covers vs what it can't

First, the distinction that kills most confusion (verified, Oct 2026):

```
  CONTROL PLANE              DATA PLANE
  what the AGENT does        what the APP does for users
  ─────────────              ─────────────
  read/understand code       serve requests at scale
  write + gate changes       store/mutate data
  deploy + verify            run cron/batch jobs
  detect + respond           hold sessions, queue work
```

Graphify, MemT, skills, AGENTS.md, hooks are all **control-plane** — they
make the agent better at operating the system. "Handles millions of
transactions/users" is a **data-plane** property — that's the app's own
architecture (Postgres sizing, worker pools, queues). No agent tool
answers it; a harness can't fix a data-plane problem. Our data plane is
the Cloudflare stack (DO + D1 + KV + R2 + Queues); Odoo's is
workers+Postgres+nginx. Different problem, different owner.

## Coverage matrix — where 90% actually is

| Production domain | Covered by | Status | Gap → fill |
|---|---|---|---|
| Agent context | AGENTS.md + skills + agentic search | ✅ solid | graphify at multi-repo scale |
| Pre-merge correctness | 12-gate + jev typed judgment + ledger | ✅ ahead of industry | cumulative-diff view (merge queue) |
| Release | gated deploy + canaries | ⚠️ thin | `wrangler versions` % rollout, rollback drill |
| Runtime scale (data plane) | CF primitives: DO, Queues, D1 | app-specific | not a harness question — per-system design |
| Data integrity | reconcile cron, ledger invariants | ✅ solid | expand beyond money paths |
| Observability | error-tail + usage tables | ⚠️ thin | Sentry + external probe + Grafana |
| Alerting | reconcile → owner SMS | ⚠️ SPOF | Alertmanager/Keep + second channel |
| Incident response | playbooks + Oncall/Dispatch model | 📝 designed | write actual playbook entries (below) |
| Security | guards + registry + canary authz | ✅ solid | Infisical Agent Vault for agent creds |
| DR / backups | offsite forum backup | ⚠️ unverified | D1 restore drill, restore-time measure |
| Change management | deploy lock + gate + audit trail | ✅ solid | = automated CAB for ERP shops |
| Staging/data rehearsal | none | ❌ missing | test system (mandatory for Odoo-scale) |

Score: dev→gate→deploy→detect→respond loop is the ~90%. The missing 10%
isn't more docs — it's drills (rollback, restore), a second alert
channel, and staging. All scheduled-work, not research.

## Oncall for an ERP — what a playbook entry concretely does

Playbooks aren't "restart it" — worked example for the classic:

```
── playbook: posting-batch-silent ───────────────────────────
  signal:    business-metric sweep — voucher/invoice rows
             created == 0 during 09:00–11:00 weekday window
             (baseline ~200/15min)
  severity:  sev1 — money path idle in business hours
  first5:    1) cron worker alive? (process count / last heartbeat)
             2) scheduled-action queue depth growing?
             3) last successful run timestamp + error column
             4) DB locks blocking the posting job?
  blast:     no postings → no settlement → downstream billing stale
  mitigate:  restart cron worker / clear stuck job instance.
             POSTING DATA IS NEVER PATCHED BY HAND — fix the
             trigger, replay the job, don't edit rows.
  escalate:  if lock contention is a migration mid-run or the
             job fails on replay → page human, attach 5-min data
  durable:   add zero-floor alert if none; if failure class
             repeats → gate rule or test gets added in postmortem
```

Same skeleton fits LivePair (gen-failures spike, webhook silence) —
the domain names change, the loop doesn't. The responder — Devin
Oncall, Grokbot-dispatched session, or human — runs identical steps
because the playbook is the contract.

## The one-line answer on Graphify & scale

Graphify's verified number: **71.5× token reduction** on the
karpathy-repos corpus (~123k → ~1.7k/query BFS subgraph) — an agent-side
context saving. It makes the operator cheaper/faster at *reading*; it
does not make the system serve more users. Control plane ≠ data plane.
(Karpathy link clarified: he described the knowledge-base workflow;
Graphify is a third-party implementation benchmarked *on his repos* —
he didn't build it.)
