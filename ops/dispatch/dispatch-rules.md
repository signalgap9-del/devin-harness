# Dispatch rules — what Grokbot (or cron) opens, and when

The dispatcher's contract: it never codes, never holds prod secrets,
never decides policy. It watches signals and opens Devin sessions with
pre-written prompts. Fill the thresholds per repo — the shapes are
universal.

## Signal → session table

| Signal source | Condition | Session prompt (fill per repo) |
|---|---|---|
| git log | `git rev-list --count main --since="<last index run>" > N` | "Refresh the code index (graphify/docs) for changes since <sha>" |
| business-metrics sweep | metric below floor / rate collapse | "Investigate <metric>: pull the last N ledger rows, reproduce, propose fix or escalate" |
| deploy webhook | deployment.status = success | "Run canary suite; append result to release ledger" |
| guard ledger | count(decision=block) spike > X/day | "Summarize what was attempted and blocked this week — pattern or noise?" |
| cron (weekly) | always | "Audit: stale locks, open obligations in state.json, incidents without artifacts" |
| alert channel | page fires with unknown failure class | "Open oncall session: attach playbook for <class> or escalate with first-5-minutes bundle" |

## Rules the dispatcher obeys

1. **One open session per signal class** — dedupe before opening; a flapping
   alert must not spawn 40 sessions.
2. **Prompts are templates in this file**, not freeform — the dispatch
   prompt is itself reviewed text (it enters the gated environment).
3. **Sessions inherit the harness** — a dispatched session runs inside the
   same guards/ledger/gates as a human-opened one. No privileged mode.
4. **Escalate, don't retry** — a session that fails the same playbook twice
   becomes a human page, not a third session.
5. **Every dispatch lands in the ledger** — the ledger is how you audit
   what the dispatcher did overnight.

## Wiring

`devin-session.mjs` (this dir) is the call the dispatcher makes —
`node devin-session.mjs "<prompt>"` → session URL. Point Grokbot's
"Devin Manager" template, a cron, or a GitHub Actions `repository_dispatch`
step at it. Secrets: `DEVIN_API_KEY` env only — never in this file.
