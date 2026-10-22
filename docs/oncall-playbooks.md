# On-call playbooks — the framework layer

Tooling answers "who gets paged"; playbooks answer "what happens next".
This is the framework that makes Devin Oncall / Grokbot / a human
interchangeable responders.

## Anatomy of a playbook (runbook entry)

```
── playbook: <alert name> ───────────────────────────────────
  signal:     what fired (metric, canary, user report)
  severity:   sev1 users-can't-pay | sev2 degraded | sev3 noise
  first 5min: 3 commands/queries that confirm or clear it
  blast:      what breaks if this is real (auth? ledger? gen?)
  mitigate:   the SAFE action — kill-switch, flag, rollback
              (mitigation ≠ root cause; stop the bleeding first)
  fix path:   where the code lives, who/what fixes
  escalate:   when to wake the human (money + no auto-fix)
  postmortem: link template; recurring → rule or test gets added
```

The discipline: **every playbook ends in a durable fix** — a gate rule,
a canary, a test, or an alert threshold change. A playbook that only
says "restart it" is debt.

## Incident lifecycle (the loop all responders run)

```
 detect ──► triage ──► mitigate ──► resolve ──► postmortem
 (signal   (sev +     (bleeding    (root      (adds a rule/
  source)   blast)     stopped)     cause)     canary/test)
```

Severity matrix cheat-sheet: **sev1** = money or signup broken, page now.
**sev2** = degraded but working, fix same-day. **sev3** = anomaly, queue it.

## How the responders plug in

| Responder | Role | How it's driven |
|---|---|---|
| **Devin Oncall** | the responder | Slack/telemetry alert → Responder investigates → Incident opens a fix PR → Reports surface recurring classes. Playbooks = the "Instructions" you write at setup |
| **Grokbot** | the dispatcher, not the responder | watches channels/queues → routes work to Devin sessions → monitors progress, nudges, collects outcomes. Never holds secrets, never writes the fix itself |
| **Human** | escalation target | paged when playbook says escalate; sees playbook context, not raw alert |
| **cron/reconcile** | the always-on detector | business-metric sweep that FEEDS the playbook signal (stale pending → SMS) |

## Slack wiring (mechanics, verified)

1. Settings → Connections → Slack → install to workspace.
2. `@Devin <task>` in a channel/thread starts a session with that context.
3. `!ask <question>` answers inline **without** opening a session.
4. Emoji/message triggers + auto-triage channels: react or post → Devin
   triages. This is the path where a Slack alert bot's message becomes an
   Oncall responder run.
5. Oncall separately: sidebar → Begin setup → connect telemetry source →
   it learns your stack for ~1–2h → Responders/Incidents/Reports unlock.

## Grokbot capability boundary (what it actually does)

- CAN: create/manage Devin sessions via API, route tasks by type, watch
  progress events, send corrective messages, collect results, document.
- CANNOT: run the fix itself (it's a manager), hold provider keys (secrets
  stay server-side, never in the message bus), or gate its own actions
  (its triggers still pass through the same hooks/guards).

So the full loop: **Grokbot routes → Devin executes inside the gated
harness → Oncall responds to signals → playbooks make every response
repeatable → postmortems harden the gate.** Each piece is optional alone;
the framework is what makes them compose.
