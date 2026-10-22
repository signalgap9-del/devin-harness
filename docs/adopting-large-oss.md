# Adopting a large OSS codebase into production — the Odoo test

Question: can this harness take something like Odoo (1M+ LOC ERP,
Python+JS, PostgreSQL) and ship it production-grade? Verified against
Odoo 19 deploy docs + Docker Hub + sysadmin guides, Oct 2026.

## Short answer

**The harness is codebase-agnostic — it works on Odoo the day you clone
it.** AGENTS.md, hooks, gates, ledger, playbooks don't care what's in the
repo. What does NOT transfer is the deploy lane: our 12-gate pipeline is
Cloudflare-shaped. Odoo production is a *systems* problem, not an agent
problem — and every piece it needs is already in the catalog.

## What Odoo production actually requires (verified)

```
  nginx ──► odoo workers (multiprocess, --workers=(2×CPU)+1, ~6 users/worker)
    │         ├── cron workers (max_cron_threads)
    │         ├── gevent process → :8072 websocket/longpolling
    │         └── per-worker limits (mem soft/hard, cpu/real time, req count)
    ├── /web/filestore → x_sendfile (nginx serves, not Python)
    └── PostgreSQL — dedicated role+db, ONLY dependency
  plus: separate testing system (same arch, never shared),
        OCA addons on read-only mounts, admin_passwd for db manager
```

## Layer-by-layer transfer

| Our harness piece | Odoo version |
|---|---|
| deploy gate (12 stages) | module tests + upgrade dry-run + `odoo-bin --stop-after-init` smoke + migration check |
| canaries on real paths | login → invoice-create → report-render probes |
| business-metric sweep | **Odoo cron jobs ARE the batch layer** — zero-floor alerts on scheduled actions, invoice counts |
| reconcile/ledger invariants | Odoo is an accounting ledger natively — invariants are its religion |
| action ledger | audit trail ERP shops already require |
| kill-switches | config flags / addon toggles |
| AGENTS.md hierarchy | per-module (`addons/*/AGENTS.md`) — the hierarchical split finally pays for itself at this scale |
| jev gate | diff review on custom-module changes only — never review upstream vendored code |

## The rules that matter at this scale

1. **Vendor boundary is sacred.** Never patch upstream Odoo — custom
   code lives in addons (`/mnt/extra-addons`). file-guard equivalent:
   block edits outside `oca/` read-only mounts + custom addon dirs.
2. **Upstream sync cadence.** Pin a version, schedule upgrade windows,
   never track HEAD. OCA modules pin per-version too.
3. **Test system is mandatory, not optional.** Odoo's own docs: same
   architecture, separate machine. Upgrades rehearse there first —
   this is the staging-env gap from release-engineering.md made
   non-negotiable by data size.
4. **Context strategy inverts.** In a 1M-LOC monorepo the agent can't
   read "the codebase" — hierarchical AGENTS.md + agentic search +
   module boundaries do the work. This is where graphify-class tools
   stop being optional.
5. **Data > code.** Backup/restore drills + migration rehearsals are
   the deploy gate. Odoo upgrades mutate data in place; the rollback
   plan is a database restore, not a git revert.

## Verdict

뚝딱 런칭 수준? **The agent-harness half: yes, today.** AGENTS.md layers +
gates + ledger + canary patterns port unchanged. **The production half:
the catalog covers it, none of it is exotic** — nginx+workers+postgres+
backups is 1990s-grade ops dressed in Docker. What you can't shortcut is
data migration rehearsal and the test system — those are calendar time,
not tooling. For an ERP interview this answer IS the demo: "the harness
layers transfer; here's the exact system topology Odoo needs and where
each catalog tool plugs in."
