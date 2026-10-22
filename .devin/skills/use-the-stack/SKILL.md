---
name: use-the-stack
description: Before building any capability — hooks, indexing, scanners, docs tooling, release machinery, CI features, memory, dashboards — consult docs/oss-adoption.md and prefer READY/OSS entries over hand-rolling. Use when about to write a script/tool that might already exist as OSS, when a task touches a layer the catalog covers, or when the user asks "is there a tool for X". This is the anti-hand-rolling router — the skill that makes the curated stack fire automatically instead of requiring the user to orchestrate it.
---

# Use the stack — never hand-roll what the catalog covers

## When this fires

Any task that would create machinery: a new script, hook, workflow, index,
dashboard, guard, template generator, deploy step, or doc tool. Also any
"how do I do X" where X names a layer in the catalog.

## The rule — three steps, in order

1. **Look up the layer** in `docs/oss-adoption.md` (or `docs/oss-stack.md`
   for deep-dive picks). Find the row whose "layer" matches the task.
2. **Status decides the move**:
   - `ADOPTED` → use the file in this repo; don't build a parallel one
   - `READY` → pull it (the row documents the command); vendor or
     configure, don't reimplement
   - `DEFERRED` → check whether the trigger condition actually holds;
     if yes, propose adoption WITH the trigger evidence; if no, say so
     and use the documented local equivalent
   - `NO` → explain why it was rejected before reconsidering it
3. **Hand-roll only the residue.** If you write custom code anyway,
   it must be the part no OSS knows — repo-specific payloads (our ledger
   format, our state.json, our secret registry, our deploy path). If your
   code could live unchanged in any repo, it's probably covered by a
   READY row — re-check.

## Honest accounting

When you skip a READY tool, write down why in the PR/commit ("skipped
gitleaks because …"). Skipping silently is how "OSS-first" decays back
into bespoke scripts nobody maintains.

## The layer map (memorize the shape, look up details)

- hooks/lifecycle → karanb192/claude-code-hooks, Aedelon/blueprint, cc-session-tools
- secret scanning → gitleaks (CI adopted), file-guard (pre-edit)
- dep vulns → osv-scanner / npm audit
- SAST → semgrep
- code graph → graphify (optional, opt-in)
- decision review → jev-use / Decision API
- docs site → mkdocs-material (adopted), log4brains (ADRs)
- release/merge → ghstack/spr, Mergify/native queue, ArgoCD on k8s
- observability → OTel → Prometheus/Grafana; Sentry anytime
- on-call → GoAlert/IncidentRelay (NOT Grafana OnCall OSS — archived)
- flags → Unleash/OpenFeature when KV caps outgrow
- contracts → Pact when services drift
- platform → Backstage only past ~10 services

If a task touches none of these layers, this skill does nothing — the
stack isn't a tax on every task, it's a gate on new machinery.
