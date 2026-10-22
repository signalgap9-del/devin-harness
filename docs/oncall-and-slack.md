# On-call & Slack

Two flavors, pick per team size: **Devin's managed Oncall** (fastest —
learns your systems and writes its own skills) or **self-hosted alerting**
(your own probes → your own pager channel). A real deployment often runs
both: managed Oncall as the responder, self-hosted probes as the guarantee
that nobody depends on a single vendor's eyes.

## Devin Oncall (managed)

One-time setup per org (admin):

1. Sidebar → **Oncall** → Begin setup.
2. Connect ≥1 telemetry tool (Datadog/Sentry/PagerDuty/Grafana etc.) — or
   "Set up without tools" if telemetry already reaches Devin's env.
3. Choose how often Devin refreshes its learned skills (Never/Weekly/
   Monthly — default Monthly). Each refresh counts toward usage.
4. Finish — Devin studies your systems ~1–2h, then Responders /
   Incidents / Reports unlock.

- **Responders**: triage alerts/bugs/support questions as they arrive.
- **Incidents**: root-cause → mitigate → fix PR. Stop/Resume per incident.
- **Reports**: recurring insight digests (alert thresholds to tune,
  recurring issue classes) — usable as weekly on-call handoff.
- **Instructions** setting: a markdown doc every Oncall session follows —
  treat it as `AGENTS.md` for incidents (runbooks, escalation order, what
  never to touch).

## Slack integration

Settings → Connections → Slack → Connect → install the Devin app → each
user clicks **Link user profile** once (Slack email must match the Devin
account email).

In-channel:

| Keyword | Effect |
|---|---|
| `@Devin <task>` | start a session from any channel (attachments OK) |
| `@Devin !ask <q>` | quick codebase answer, no session |
| `@Devin mute` / `unmute` | thread noise control |
| `(aside)` / `!aside` | comment Devin ignores |

**Automations** (Settings → Automations): Slack triggers fire sessions —
"message in #bugs", "🚨 reaction added", "@oncall group mentioned". Plus
**Auto-triage**: invite Devin to a channel and it watches/triages incoming
reports continuously.

## Self-hosted alerting (always keep this)

Managed oncall is a convenience, not a dependency. The floor you own:

- Probes: `business-metrics.example.mjs` + the canary pattern (real
  journey, not `/health`).
- Page path: SMS webhook (Twilio/Bird) or Slack incoming webhook — two
  channels minimum, and per-channel failure logging so a dead Twilio
  doesn't silently leave email as the only hope.
- If you want a bot on the channel instead of raw webhooks: a Slack app
  posting to #incidents + a responder session triggered by @oncall mention
  covers the same loop.

## What belongs in Oncall "Instructions"

- Escalation order + who gets paged
- The hard rules from AGENTS.md (never edit ledger rows, never rotate
  creds, deploy only via the gate)
- Runbook links per alert class
- What Devin may auto-fix vs must propose (e.g. auto-open PR, never
  auto-merge to main)
