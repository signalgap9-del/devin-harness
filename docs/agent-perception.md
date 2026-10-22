# Agent perception — the environment IS the capability

Thesis (correct): guards are *restraint*; perception is *capability*.
An agent's ceiling is set by what it can see, not by what it's told.
Palantir's bet is the same idea in enterprise form — the Ontology is a
perception layer over company data; agents reason over objects/links/
actions instead of raw tables. For a codebase the equivalent question:
**what artifacts can the agent sense, and how fresh are they?**

## The perception stack — six layers, cheapest first

| Layer | What the agent senses | Tools (verified OSS) | Cost shape |
|---|---|---|---|
| **L0 raw** | files, text | grep/glob/read — agentic search (Anthropic's choice: live over stale index) | tokens per read; zero build cost |
| **L1 repo-map** | every file's key symbols+signatures in one artifact | **aider repomap** (tree-sitter → compact map injected per turn — the proven cheap version) | ~1–3k tokens/turn for a real repo |
| **L2 code-as-database** | the program materialized as queryable relations | **CodeQL** (`github/codeql`, QL over the repo), **Glean** (`facebookincubator/Glean`, typed fact store, Angle), **Kythe** (`kythe/kythe`, Google's index graph), **SCIP/LSIF** (`sourcegraph/scip`, index *format* not DB), **Joern** (CPG for security) | build-time compute; queries near-free; index goes STALE — needs refresh (dispatcher's job) |
| **L3 semantic/org ontology** | what services exist, who owns them, what they do | **catalog-info.yaml** (Backstage format — works even without Backstage), OpenAPI specs, ADRs, CODEOWNERS, `sitemap`-style route maps | near-zero tokens; it's metadata |
| **L4 runtime perception** | what prod is doing RIGHT NOW | OpenTelemetry → Prometheus/Grafana, Sentry MCP, Grafana MCP server, Wrangler tail, provider dashboards | the difference between "looks fine" and knowing |
| **L5 world + memory** | outside systems, and what was learned | web_search, MCP servers (the senses-into-services standard), our ledger/state.json/incidents | per-call |

## Palantir mapping — what "ontology" is for a dev stack

| Foundry | Dev equivalent |
|---|---|
| Object types (nouns: Customer, Order) | catalog entities (service, route, table, cron) + Drizzle schema + OpenAPI paths |
| Links (edges) | ADR references, CODEOWNERS, import graph, webhook→fulfillment flows |
| Actions (verbs, permissioned) | the gated commands — our ops scripts *are* the action layer: guards make actions safe, ontology makes them findable |
| Foundry "why" (lineage) | ledger + incidents/ + state.json |

The transferable lesson: Palantir works because **the model of the
organization is data, not folklore**. Same for agents: AGENTS.md rules
are folklore; catalog-info.yaml, schema dumps, and an API spec are data.

## "Do we need reverse engineering?"

For systems you own: **no** — you generate perception artifacts, not
reverse-engineer them (`drizzle-kit introspect`, OpenAPI generation,
route tables, MCP endpoints). RE only enters for systems you *don't*
control and can't instrument — the real ERP case: legacy screens with
no API (UI automation/log introspection), vendor binaries, undocumented
protocols. Even there the order is: official API → documented export →
introspection → RE last. For LivePair: not needed — everything is ours.

## What we can generate TODAY for livepair-deploy

Cheap perception artifacts that don't exist yet:

```bash
npx drizzle-kit introspect          # DB schema → committed doc (L3)
route table from routes.ts           # /api/* map → docs/routes.md (L3)
catalog-info.yaml                    # service descriptor, Backstage-format (L3)
ops/verify/business-metrics          # already exists — the L4 seed
```

Plus wiring: a `repo-map` regen on merge (dispatcher slot — same
"index freshness is maintenance" pattern as graphify), and Sentry/Grafana
MCP added to `mcp_config.example.json` when adopted.

## The honest limit

Perception has a freshness contract — every index/map/ontology is a
claim about the repo **as of build time**. Stale perception is worse than
none (a wrong map teaches wrong moves). So the stack always pairs
index-with-dispatcher: someone (cron/Grokbot) regenerates, or the agent
falls back to L0 live reading. That's the same reason Anthropic dropped
RAG indexes for agentic search — L0 is never stale.
