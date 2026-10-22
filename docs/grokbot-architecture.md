# Grok Bot architecture

How xAI's Grok Bot actually composes — and where it sits next to Devin.
Researched against grokbot.dev / crosswalk.to / composio docs (Oct 2026).

## Anatomy

```
┌──────────────────────────────────────────────────────────┐
│  Grok Bot (x.ai/bot app — desktop + iPhone companion)    │
│  • persona: name + role + short job description          │
│  • context: files/notes the bot holds                    │
│  • skills: instructions it follows                       │
│  • plugins/connectors: MCP servers, apps it can call     │
│  • included with Cursor Ultra / SuperGrok Heavy          │
└──────────────────────────┬───────────────────────────────┘
                           │ MCP / connectors
                           ▼
        ┌─────────────────────────────────┐
        │  integration layer              │
        │  • crosswalk.to  — message bus  │
        │  • Composio      — managed auth │
        │  • grokbot.dev   — bot store    │
        └─────────────────────────────────┘
                           │
                           ▼
        ┌─────────────────────────────────┐
        │  Devin (API / MCP surface)      │
        │  sessions, PRs, this harness    │
        └─────────────────────────────────┘
```

## The three integration paths (concrete)

1. **crosswalk.to** — shared feed both agents read/write.
   Grok: grok.com → Connectors → Custom → `https://mcp.crosswalk.to`.
   Devin: Customize → MCPs → custom HTTP MCP, same URL, Auth Header
   (Bearer) or OAuth; the key is created at crosswalk.to/keys and pasted
   into the MCP settings — never into chat. Each side polls; neither
   relays by hand.

2. **grokbot.dev "Devin Manager" template** — installs a *team* of bots:
   one opens Devin sessions per job, others watch and steer when a run
   drifts; screenshots/test recordings return to the chat. Shared bots
   copy their instructions into your account — read before installing,
   never paste keys they ask for.

3. **Composio Devin MCP** — managed OAuth/scopes/refresh + 1,500-tool
   gateway + per-tool controls + audit trail. The team/enterprise path.

## grokbot.dev as infrastructure

The directory itself is agent-readable — a public JSON API designed for
bots to self-serve:

```
GET /api/v1/status.json    capabilities, deprecations — read first
GET /api/v1/feed.json      lean feed, scan + rank
GET /api/v1/templates.json shareable bot templates (install links)
GET /api/v1/plugins.json   plugin catalog
GET /api/v1/use-cases.json use-case prompts
GET /rss.xml               RSS mirrors
```

No auth, CORS `*`, `api_version` + `schema_revision` in envelopes — the
contract a bot consumes to discover new capabilities on a schedule.

## Rules that keep it sane

- Orchestrator manages, executor executes — bots spec jobs and review
  outputs; Devin does the work.
- Secrets never cross the bus — each side keeps its own credential store.
- One job, one session — parallel bots on the same files = merge pain.
- Repo hooks still gate everything — orchestration doesn't bypass
  `agent-guard.mjs`; it changes who *asks*, not what's allowed.
