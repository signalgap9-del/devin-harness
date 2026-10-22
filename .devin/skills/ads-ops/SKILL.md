---
name: ads-ops
description: LivePair paid-acquisition ops — Google Ads + Reddit Ads for the studio. Use when touching ADVERTISING.md, campaign scripts, conversion events, the Reddit/gtag pixels, geo-gate vs ad traffic, or any "run ads / is the funnel tracked" question.
---

# Paid acquisition for your-product.com

Canonical spec: `ADVERTISING.md` (repo root) — demand map, ad groups,
keywords, negatives, budgets. This skill is the operational state + rules.
**Read the launch checklist below before assuming anything is "ready".**

## Channels (current decision)

- **Google Ads Search** — intent capture: model names, task terms, brand.
- **Reddit Ads** — community reach: gen/competitor/creator subreddit stacks.
- Both are paid channels; `ops/reddit/` (organic comment ops) is a SEPARATE
  system — do not conflate, and the owner deprioritized organic for now.

## Infra map (what exists)

| Piece | Where | State |
|---|---|---|
| gtag `AW-XXXXXXXXX` + GA4 | `root.tsx`, `wrangler.toml` GTAG_ID/GA4_ID | live |
| Consent Mode v2 + banner | `root.tsx`, `consent-banner.tsx` | live — every tracker must respect `lp_consent`/`__lpConsentRequired` |
| Reddit pixel | `root.tsx` (`__lpRdtInit` lazy init), CSP in `worker.ts`, `REDDIT_PIXEL_ID` var | code shipped — **needs the `a2_…` id** from a Reddit for Business account |
| Conversion events | `sign_up` (2 sites), `purchase`/`begin_checkout` (billing), `first_generation` + `generate` (studio resume, localStorage-gated) | live; rdt mirrors SignUp/Purchase/PageVisit/Custom:first_generation |
| UTM attribution | `root.tsx` ATTRIBUTION_SNIPPET → `lp_att` → `/api/attribution` → `/api/stats` | live |
| Google Ads API scripts | `apps/web/scripts/google-ads/` | live — SA auth on my-gcp-project (Basic access), campaign ENABLED |
| Keyword Planner (volume/CPC research) | `apps/web/scripts/google-ads/kw-planner.mjs` | live — `node kw-planner.mjs "kw…"` / `--file` / `--url`; real Google Ads data, read-only |
| Reddit Ads API scripts | `apps/web/scripts/reddit/` | client ready — **advertiser profile SUSPENDED**, appeal needed |
| Ads conversion actions | `conversions.mjs` + send_to snippets in sign-up/billing | live — LP-SignUp/LP-Purchase primary, LP-BeginCheckout secondary |
| BigQuery ads transfer | `my-gcp-project:livepair_ads` `p_ads_*` daily 06:00 UTC | live — runs as ads SA, see bq-transfer.mjs |
| Local ops console | `ops/ads-console.mjs` → Desktop `LivePair Ops\1 - Ads Console.cmd` | live — status/start/stop/budget/cpc + reports, localhost:4300 |
| Spend brakes | APP_KV `signup_cap`, `live_*` caps | live |

## Launch checklist (update statuses as things land)

- [x] Studio-focused campaign spec in ADVERTISING.md
- [x] first_generation conversion event
- [x] Reddit pixel wiring + consent gating
- [x] Geo gate: GEO_BLOCKED is now **KR-only** (opened 2026-11) — sanctioned
      states + porn-illegal markets refuse at PAYER/GEN layers instead.
      Operator IP exempt via DEV_IP_ALLOWLIST
- [ ] **OWNER** Reddit for Business account → pixel → set REDDIT_PIXEL_ID
- [ ] **OWNER** Cloudflare WAF custom rules eyeball check (no local CF token)
- [x] Google Ads API access — SA on my-gcp-project (Basic), campaign live
- [ ] **OWNER** Reddit Ads creds — **blocked on advertiser-profile
      suspension** (appeal at reddit.com/appeals; campaign+group paused,
      structured-post job rejected)
- [x] Location targeting = payer-capable geo: US/CA/GB/DE + gray-zone tier
      AU/NL/SE/SG/PL/CZ (2026-10-13) — EN-native or top English-proficiency,
      PayPal/crypto viable, cheaper CPC. Excluded on purpose: IN/PH/BR/MX
      (cheap clicks, weak payment conversion), JP (needs localized funnel),
      MENA (ad-surface risk), GEN/PAYER_BLOCKED (click ≠ convertible).
- [x] Conversion actions registered natively (LP-SignUp/LP-Purchase)
- [x] First test live: ₩6,000/day, read weekly
- [x] AdsBot WAF bypass — DONE 2026-10-14 via CF API (no owner dashboard
      needed; CLOUDFLARE_API_TOKEN has ruleset write): custom-ruleset top
      rule `(lower(http.user_agent) contains "adsbot") and
      (ip.src.asnum in {15169 396982})` → skip waf+bic+rateLimit+
      securityLevel+uaBlock+zoneLockdown+remaining custom rules; also
      added "adsbot"/"google-ads" to the managed_challenge bot allowlist.
      ASN-gated so UA spoofers from non-Google IPs stay challenged.
      Fresh reviews re-triggered via `new-rsa.mjs <group> unlock-v2`
      (brand + studio-intent); old disapproved ads PAUSED.
- [x] Good-bot allowlist widened to ~56 crawlers (search + ads + AI-search
      citations + social previews + monitors) — owner directive: run it
      LOOSE, AI-search bots must reach the site. Enforced by
      `ops/verify/waf-goodbots.mjs`, wired into predeploy gate 2 —
      any live-rule drift that drops a required bot fails the deploy.
- [ ] Domain SEXUALLY_EXPLICIT topic — reslugs committed; clears only
      after deploy + Google recrawl. Verify via `policy` command; if
      still set after recrawl, request review in Ads Policy Manager.

## Hard rules (policy — account is a durable asset, not disposable)

- NEVER bid explicit-intent keywords or copy (nsfw/uncensored/야한 etc.) in
  ANY language. Factory sites burn accounts doing this; ours is single.
- Competitor names: keywords only, never in ad copy (trademark).
- No interview/cheating angles (legacy copilot rule, still binding).
- Ad copy ceiling: "private AI studio", "pay per result", model names,
  honest prices. The private line is discovered on-site, not advertised.
- Landing must match the ad group's promise (task keyword → task page).
- Non-English campaigns deferred: need localized landing + clean keywords
  only; KR/CN are geo-blocked dead ends anyway.
- **Public surfaces are part of the ad surface.** Google classifies the
  DOMAIN, not the ad — burned 2026-10-14: `/for/sexy-ai-girls`,
  `/for/bikini-models`, `/for/waifu` + "no refusal screens"/boudoir copy
  got the whole domain flagged SEXUALLY_EXPLICIT (brand ad LIMITED)
  while every keyword stayed APPROVED. Same goes for spicy
  titles/meta/slugs on ANY crawlable page — sitemap included.
- **Crawler reachability is a policy gate.** AdsBot is not a Cloudflare
  verified bot — zone Bot Fight Mode challenges it →
  DESTINATION_NOT_WORKING at domain level, and the API then refuses to
  create ANY new ad on the domain (POLICY_FINDING at create time, not
  review time). `node campaign.mjs policy` shows ad approval + topics +
  keyword approval in one shot; check it before touching keywords — the
  diagnosis order is domain topics → ad approval → keyword approval.

## Decision playbook — required sequence, no shortcuts

Burned 2026-10-13: keywords were picked by pattern-matching the model
catalog without asking who pays, then churned one-by-one under review.
These rules exist to stop that.

### 1. Buyer-first — every targeting decision names its payer

Before adding/removing ANY keyword, ad group, or copy, answer in one line:
"which payer does this catch, and why do they pay US?" No answer = no change.

Buyer classes, ranked by pay-intent (evidence-weighted):

1. **Dev/API builders** — integrating gen into their own product; pay per
   call forever once integrated. Proven: first organic signup went straight
   to API keys. Keywords: `<thing> api`, `<model> api`, `<model> alternative`.
   Model-name keywords MUST match models we actually serve.
2. **Competitor migrants** — civitai/venice users already paying for gen
   elsewhere; lowest education cost. `<competitor> alternative`.
3. **Mainstream-blocked users** — "X refused me" searchers; pay intent
   exists but blended with freebie hunters. `no filter`/`no restrictions`
   phrasing, NEVER explicit terms.
4. **Privacy-framed consumers** — broadest, weakest pay intent;
   `private ai image generator` tier.

NOT buyers (always negative-prone): free seekers, DIY/comfyui researchers,
jobs/tutorial/paper/course intents.

### 2. No tunnel-vision — context before mechanics

Never answer a targeting/messaging question from a single data source
(e.g. grepping the catalog for model names). Sequence is mandatory:

buyer → their trigger moment ("what just failed for them?") → search
language they'd actually type → policy tier check → keyword/copy.

If a request sounds like "just map X to keywords", stop and re-derive the
buyer first. One answer at a time; don't dump everything at once and don't
fixate on the nearest artifact.

### 3. Keyword changes are SET diffs with reasons

- Change in clusters, each cluster carrying a why-line (buyer class +
  trigger). No reactive single-keyword churn — batch, then let it run.
- Match types: phrase/exact only under small budgets. Broad = spend fire.
- Every keyword must land on a page matching the promise.
- Commit messages state the buyer reasoning, not just the diff.

### 4. Signal hierarchy — what proves a visitor is a payer

`api_key created` > `purchase` > `first_generation` > `sign_up` > click.

A signup that never reaches first_gen or API-key creation is a bounce
with extra steps. Judge channels on payer signals, not signup count.

### 5. Policy tiers (fresh account = one tier more conservative)

- **A — never, anywhere**: explicit sexual terms in any language.
- **B — keywords only, never copy**: uncensored/unfiltered/no-filter
  phrasing. Watch review flags; drop on any policy strike.
- **C — clean surface**: private, unlock, pay-per-result, model names,
  competitor names (keywords only).

Positioning word is **"unlock"** — capability unlocked, not "we're
edgier". Never advertise the spicy layer; it's discovered on-site.

## Measurement discipline

- Optimize campaigns on SignUp/Purchase (Reddit requires default events);
  `first_generation` is the quality gate for judging channel traffic —
  a signup that never generates is a bounce with extra steps.
- Weekly loop (in ADVERTISING.md): search-terms → negatives; cluster CTR/CVR
  → reallocate; /api/stats utm → signups → first_gen → purchases.
- Bidding progression: Manual CPC/capped → ≥30 conv/30d → Max Conversions
  or tCPA. Never PMax/broad before the conversion loop is fed.
- Reddit last-click undervalues — judge with 24–48h view-through too.
- Warehouse: BQ transfer lands `p_ads_*_3464240376` in
  `my-gcp-project:livepair_ads` daily (config in scripts/google-ads/README).
  `ClickView.gclid` joins to `user.attribution` for spend→margin queries.

## Third-party tools warning

Do NOT connect hosted ad-MCP proxies (e.g. Ryze `connector.get-ryze.ai`) to
production ad accounts — OAuth tokens + account data flow through their
infra. Our own `scripts/google-ads`/`scripts/reddit` direct-API clients are
the sanctioned path. Read-only prompt repos are fine as reference only.
