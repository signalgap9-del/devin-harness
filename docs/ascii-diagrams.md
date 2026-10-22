# ASCII diagram methodology

AWS docs ship ASCII diagrams because they're diffable, greppable, version
with the code, and render everywhere from a terminal to a PR body. This is
the house convention.

## When to use

- Architecture flows, request paths, deploy lanes, trust boundaries —
  anything a reviewer needs to diff alongside the code change.
- Never for: pixel-precise UI mockups, charts, anything that needs color.

## Character palette — pick one, never mix

```
portable ASCII:   +---+  |   --->   ===   (survives every font/tool)
box-drawing:      ┌───┐  │   ───►   ═══   (prettier; breaks in some tools)
```

Default to **portable ASCII** in docs/ — box-drawing chars mangle when
copied through chat tools and some fonts. Reserve box-drawing for READMEs
verified to render correctly.

## Composition rules

1. **Entry point top-left, data flows down or right.** Never upward.
2. **Layered bands** — clients / edge / services / data / ops, separated by
   blank lines or `===` rows. AWS diagrams read top-down; copy that.
3. **Label every arrow.** `-->` alone says "something flows"; the label is
   the information.
4. **Mark trust boundaries explicitly** — `=== boundary ===` or a dedicated
   band. Tenant isolation, secret edges, and public/private splits are the
   point of most of our diagrams.
5. **Async/off-path work gets a different arrow** (`~~>` or `::>`), not a
   footnote.
6. **One diagram = one story.** Two stories = two diagrams, not one crowded
   box.
7. **≤100 columns.** Wrapped ASCII is unreadable — split the diagram first.

## Reference shapes

```
── pipeline/lane ────────────────────────────────────────────
  source --> [gate 1] --> [gate 2] --> target
                     |
                     +--> side effect (labeled!)
── banded architecture ─────────────────────────────────────
  ================ clients ================
     browser        api client        mcp agent
        |              |                  |
  ================ edge ==================
        +------------+-------------------+
        v            v                   v
     [router] --> [service] --> [store]
                      |
                      ~~> async: ledger/queue
── sequence ────────────────────────────────────────────────
  A                B                C
  |--- 1. request ->|                |
  |                 |-- 2. verify -->|
  |<- 3. verdict ---|                |
```

## Maintenance rule

A diagram that drifts from the code is worse than no diagram — it teaches
wrong. Any edit that changes a flow must update the diagram in the same
diff; gates can grep for `<!-- diagram:` markers if this becomes a problem.
