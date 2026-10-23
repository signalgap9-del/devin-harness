# Agent standards & benchmarks — Oct 2026

The "how do you measure an agent" layer — and the UK government repos
worth linking. Verified against the live repos Oct 24, 2026.

## Eval framework (the thing that makes benchmarks)

| Tool | Repo | Why it matters |
|---|---|---|
| **Inspect AI** | `UKGovernmentBEIS/inspect_ai` — MIT, ~3k★ | UK AI Security Institute's eval framework. Task = dataset + solver + scorer. Runs arbitrary external agents — **Claude Code, Codex CLI, Gemini CLI can all be benchmarked**. Sandboxing for untrusted code (Docker/K8s/Modal/Proxmox). 200+ prebuilt evals via `inspect_evals` — GAIA, SWE-bench, agent benchmarks run in one command. **This is the METR-style standard the user means: it's how you build your OWN benchmark** — define livepair-specific tasks (gen pipeline, auth journey, reconcile correctness) as Inspect tasks and the suite becomes our regression benchmark across models/versions. |
| promptfoo | `promptfoo/promptfoo` | evals + red-teaming, CI-friendly |
| lm-evaluation-harness | `EleutherAI/lm-evaluation-harness` | classic model-level evals |
| openai/evals | `openai/evals` | OpenAI's eval registry |

## Agent benchmarks (what the labs score on)

| Bench | Repo/home | Measures |
|---|---|---|
| **METR long-task horizon** | metr.org — "Measuring AI Ability to Complete Long Tasks" | THE meta-metric: 50%-success task length doubling ~every 7 months. Their task-suite format (HCAST/RE-Bench) is a template for grading real work, not quiz items |
| SWE-bench Verified | `princeton-nlp/SWE-bench` | real GitHub issues resolved (OpenAI-validated subset) — coding-agent headline number |
| Terminal-Bench | `laude-institute/terminal-bench` | terminal/shell agent tasks |
| OSWorld | `xlang-ai/OSWorld` | real computer-use across apps |
| τ-bench / τ²-bench | `sierra-research/tau2-bench` | tool-use agent + simulated user, pass^k reliability — the "consistent, not just once" metric |
| GAIA | huggingface.co/gaia | general assistant tasks |
| **HAL** (Holistic Agent Leaderboard) | `princeton-pli/hal` | agents scored on accuracy AND cost — the leaderboard that punishes token-burn; closest to "production economics" scoring |
| BrowseComp | OpenAI | browsing/research depth |

## Implementation standards (the specs everyone converged on)

| Standard | Source | Role |
|---|---|---|
| **AGENTS.md** | agents.md | THE instruction file spec — OpenAI/Codex, Cursor, Jules, Factory, Aider all read it; our layered version follows it |
| **MCP** | modelcontextprotocol.io | the senses-into-services standard — tools/data exposed uniformly |
| **A2A** | a2a-protocol.org (Linux Foundation) | agent-to-agent interop — dispatcher↔executor messaging |
| **12-factor agents** | `dexhorthy/twelve-factor-agents` (HumanLayer) | the honest build guide: own your prompts, own your context window, tools are just structured output, etc. — the closest thing to a "correct way" canon |
| Anthropic effective-agents / writing-tools-for-agents posts | anthropic.com/engineering | the design doctrine (workflows vs agents, tool ergonomics) |
| OpenAI "practical guide to building agents" | openai PDF | the parallel doctrine |

## UK government AI repos — the links

| Repo | Status | Worth |
|---|---|---|
| `UKGovernmentBEIS/inspect_ai` | active, MIT | the eval framework above — flagship |
| `UKGovernmentBEIS/inspect_evals` | active | 200+ evals; PRs gated to pre-approved contributors — read/fork, don't expect to land |
| `i-dot-ai/consult` | active incubation | consultation-analysis pipeline: Django+AWS Batch+theme-finder — real gov AI-in-production shape |
| `i-dot-ai/redbox` | **archived** (service ended 2025) | dead BUT its `5-key-lessons` doc is a production RAG postmortem worth reading — failure written down is rare |
| `alphagov/govuk-ai-accelerator` | active | already in catalog — baseline-comparison harness for AI output |
| ai.gov.uk knowledge hub | site | the AI Knowledge Hub — gov AI tools registry incl. Redbox write-up with real metrics (282-user survey) |

## What we'd actually build

Inspect gives us the METR-style trick without the lab: define ~10
livepair-critical tasks (auth journey completes, gen call returns valid
media, reconcile invariants hold, /mcp tool responds) as `Task`s with
scorers → `inspect eval` per model/config change → a private benchmark.
That's the honest version of "can the agent do OUR work" — public
benchmarks tell you the model's ceiling; a private suite tells you if
the harness is regressing.
