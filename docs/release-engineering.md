# Release engineering — production deploy-stack audit

What a gated deploy buys, and what's still missing before this stack is
"production-grade" by industry standards. Audited against the real LivePair
lane (`npm run deploy` → 12-stage gate → wrangler upload → canaries).

## Scion question, answered honestly

Scion is Anthropic's **in-house VCS** — not released, not buyable, and built
for 30,000 merges/day of agent-generated code. At our merge volume git is
fine. The transferable lesson from that post is different:

> Parallel agents break human-scale tooling — merge queues, review surfaces,
> deploy coordination — before they break the code itself.

Our actual parallel-session risks, and what covers them:

| Risk when sessions deploy in parallel | Current mitigation | Gap |
|---|---|---|
| Two deploys race | `.deploy.lock` | exists after the stale-lock incident; now has liveness + timeout |
| Session A's diff judged without B's in-flight changes | gate diffs `HEAD`, not "what lands" | **each deploy should gate the cumulative diff** — verify |
| Secrets drift between local/prod | secret registry in AGENTS.md | doc-level; no automated drift check |
| Sessions stomp the same files | nothing | path-level session locks (file-guard extension) — future |

## Deploy stack vs production baseline

| Capability | Standard | Ours | Gap |
|---|---|---|---|
| Pre-merge/deploy gate | tests+lint+typecheck | 12 stages incl. typed judgment, locale parity, catalog sync | **ahead of standard** |
| Rollout strategy | gradual % (Workers `versions upload` + traffic split) | 100% cutover every deploy | **missing — biggest single gap** |
| Rollback | `wrangler rollback`, drilled | env-var kill-switches for provider lanes only; worker rollback exists, **never drilled** | thin |
| Staging env | replica w/ prod-like data | none — canaries test prod *after* cutover | missing |
| Migration discipline | expand/contract for destructive changes | immutable applied migrations | missing expand/contract rule |
| Feature flags | systematic flag per risky feature | KV kill-switches (`live_sessions:kill`, `signup_cap`) — right shape, ad-hoc convention | partial |
| DORA metrics | deploy freq / lead time / change-fail rate / MTTR | none — `state.json` tracks violations, not outcomes | missing |
| SLO / error budget | defined "how broken is too broken" | none | missing |
| On-call | rotation + runbooks + escalation | owner SMS via Twilio + reconcile pages | solo-viable, single-channel SPOF |
| Backup/restore | restore drills, not just backups | offsite for forum; D1 restore path unverified | unverified |
| Post-deploy verify | canaries on money/auth paths | auth + MCP + judge canaries + error-tail | solid |

## The honest summary

The stack is **strong at the gate, thin around the gate**: nothing in the
industry ships a better pre-deploy check, but once code lands we have no
gradual rollout, no staging replica, no rollback drill, no outcome metrics.
Fix order by blast-radius-per-effort:

1. `wrangler versions upload` + 10% traffic split on risky deploys (hours)
2. Rollback drill once — `wrangler rollback` on a canary deploy (minutes)
3. Deploy outcome row into the ledger: sha, gate verdict, canary result,
   time-to-green → DORA metrics fall out for free (small script)
4. Staging worker + staging D1 clone — only worth it when deploys break
   prod twice in a month; don't build speculatively
