# Incident NNN: <what broke, in user-visible terms>

Date: YYYY-MM-DD  |  Severity: sev1|sev2|sev3  |  Detected by: <canary/metric/user-report/manual>

## Signal

What fired or who noticed — and how long the failure was invisible
(if it was). Time-to-detect is the metric that matters.

## Blast radius

What users/money/data actually broke. Not "the site" — the exact paths.

## Root cause

The mechanism, not the event. ("deploy hung" → "child process had no
timeout", not "the deploy was unlucky".)

## Fix

What actually resolved it — and what did NOT (so the next person
doesn't retry the dead end).

## The rule this became

Every incident must leave a durable artifact — gate rule, canary, test,
alert, or doc. A fix without an artifact is a fix that will recur:

- [ ] artifact type: <gate-rule|canary|test|alert|doc> — <what was added>
