# AGENTS.md layering — the system, not the advice

Standard (verified in `openai/codex` `agents_md.rs`): the harness walks
project root → cwd and **concatenates every AGENTS.md on that path**;
deeper files override shallower; the prompt outranks all. So a file's
rules load only when work touches its subtree. Our templates/
implementation below follows that exact model.

## The three-tier layout

```
/AGENTS.md                 ≤100 lines — non-negotiables only:
                           identity, hard bans, gate law, registry
                           POINTER (names never values)
/apps/web/AGENTS.md        route map, session resolver, tenant rules
/server/AGENTS.md          api/lib conventions, webhook+money rules
/ops/AGENTS.md             deploy lane, gates, canaries, lock
/docs/incidents/NNN.md     one file per burn — root keeps a 2-line index
```

Rules:

- **Root holds only what must be true everywhere.** Everything else is a
  subtree file — loaded only when relevant.
- **Incidents are files, not prose.** Each "burned" note extracts to
  `docs/incidents/NNN-slug.md` (signal / cause / fix / the rule it
  became). Root keeps `docs/incidents/` index lines.
- **New lesson lands in the layer it belongs to.** Deploy burn →
  `ops/AGENTS.md`. Tenant leak → `server/AGENTS.md`. Root only if it's
  a universal law.
- **Subtree files override root** for their scope; nothing overrides
  the hard bans.

## Migrating a monolith (our real case)

LivePair `AGENTS.md` (~1000 lines) splits like:

| Section today | Destination |
|---|---|
| Product mandate + multi-tenant isolation | root (it's universal law) |
| Repo map detail | `apps/web/AGENTS.md` + `server/AGENTS.md` split by subtree |
| Secret registry (names) | root — one pointer table, no values |
| GCP rules + never-destroy | `ops/AGENTS.md` (ops scope) + root keeps the one-line hard ban |
| Gray-failures doctrine | root — universal |
| Commands | subtree files each carry their own |
| Burned notes | `docs/incidents/` — one file each |

Budget check: root ≤100 lines; each subtree file ≤150; incident files
unlimited (loaded on demand). Any session touching only `server/` never
pays for the web/ops/doc context.

## Templates

`templates/agents/AGENTS.root.template.md` and
`AGENTS.subtree.template.md` in this repo — fill placeholders, don't
borrow prose.
