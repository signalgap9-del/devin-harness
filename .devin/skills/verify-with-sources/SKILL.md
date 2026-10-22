# verify-with-sources

Force primary-source verification before answering questions about external
tools, libraries, architectures, "how does X work", "what does <company>
use", version/feature claims, or any claim about the outside world that
could be checked.

Use when: the user asks about a third-party tool, another company's
engineering practice, an API/framework's current state, "최신", "요즘",
"그거 어떻게 동작해", or any question where a wrong-from-memory answer is
plausible. Also use when the user says 대충 찾지 마 / 제대로 찾아 /
강제로 리서치해.

## The contract

Answering without sources is the failure mode this skill exists to kill.
Before writing the answer:

1. **Search first** — at least one `web_search` with a focused query
   (no stuffed keyword strings). Prefer the vendor's own docs/blog/repo.
2. **Fetch a primary source** — at least one `webfetch` on an official
   page (docs, engineering blog, GitHub README). Search-result snippets
   are not enough to assert behavior.
3. **Cite** — every claim about the external world carries a source or is
   explicitly marked `unverified — from memory`. If sources conflict, say
   so and show both.
4. **Date-stamp** — if the fact is time-sensitive (versions, pricing,
   availability), say what date the source reflects.
5. **Admit the gap** — if nothing authoritative turned up, the answer is
   "I couldn't verify X; here's what I did find" — never a confident
   guess dressed as research.

## What does NOT count as verification

- Recalling the tool "exists" or its pitch from training data
- Another agent's summary or a random blog paraphrasing the vendor
- A 200 response on a marketing page (shows the page loads, not that the
  claim is true)

## The spirit

The owner has been burned by confident-from-memory answers. One fetch of
the primary doc beats five summaries. If research was cut short, say where
it stopped — "verified through X, unverified beyond Y" — the same honesty
rule we apply to production health checks.
