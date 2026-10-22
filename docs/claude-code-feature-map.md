# Claude Code feature map + Anthropic official repos

Full sweep of what the reference harness actually ships (verified against
code.claude.com docs + github.com/anthropics, Oct 2026) — and our
equivalent or gap. "I didn't know it existed" is the failure mode this
doc kills.

## Official Anthropic repos (115 public; the ones that matter)

| Repo | ★ | What it is | For us |
|---|---|---|---|
| `anthropics/skills` | 182k | canonical skill implementations + spec (agentskills.io) | skill authoring patterns to crib |
| `anthropics/claude-code` | 152k | the harness itself — issue tracker + plugin-dev skills inside `plugins/` | source of truth for hook/skill/plugin formats |
| `anthropics/claude-cookbooks` | 53k | recipe notebooks: classification, RAG, tool-use, sub-agents (Haiku subagent + Opus pattern) | worked examples |
| `anthropics/claude-plugins-official` | 43k | managed plugin directory | packaging reference for our bundle |
| `anthropics/financial-services` | 40k | enterprise vertical pack — finance workflows as skills | proof that industry packs ship as skills — ERP pack is the same shape |
| `anthropics/claude-code-action` | 9.5k | GitHub Action: `@claude` mention in PR/issue → analyze/implement, mode auto-detection, Bedrock/Vertex/Foundry auth | CI-resident agent pattern |
| `anthropics/claude-code-security-review` | 6.4k | diff-aware semantic security scan on PRs (⚠️ not prompt-injection-hardened — trusted PRs only) | gate precedent for AI review |
| `anthropics/prompt-eng-interactive-tutorial` | 38k | tutorial | onboarding material |

## Feature sweep — what the harness has vs what we wired

| Claude Code feature | What it does | Ours |
|---|---|---|
| **Subagents** (`/agents`, `.claude/agents/`) | specialized agents with own context+tools | partial — subagent profiles exist, under-used |
| **Advisor** (`/advisor`) | second model consulted at key moments mid-task | none — closest is jev gate at deploy, not mid-task |
| **Slash commands** | user-invoked skills | skills auto-invoke; no user-facing command surface needed |
| **Output styles** (Explanatory/Learning/custom) | voice+behavior presets | none (not needed — single operator) |
| **Hooks — 15 lifecycle events** | SessionStart/UserPromptSubmit/PermissionDenied(retry)/Stop/SubagentStop/… | **3 of 15** — biggest structural gap (see harness-vs-labs.md) |
| **Prompt-based hooks** | LLM evaluates hook payload | ours are deterministic shell — complementary, not inferior |
| **Code review action** | reads diff + surrounding code, verification step, check-run on PR | jev gate does this at deploy; no PR-surface comment (no PRs — solo) |
| **Security review action** | semantic vuln scan, FP filtering | deterministic gate + security skill; action equivalent exists in concept |
| **GitHub Actions integration** | `@claude` in PR/issue → agent responds in-thread | none — no CI-resident agent; ledger+gate run locally only |
| **Headless/CI mode** | `claude -p` non-interactive for pipelines | Devin API + scheduled sessions = equivalent |
| **Plugin bundles** | `.claude-plugin/plugin.json` + components | our repo IS the bundle, missing the manifest |
| **Chrome platform** | logged-in browser control | browsermcp — equivalent |
| **Remote Control / add-dir** | multi-dir sessions | workdir param — equivalent |
| **Auto mode** | classifier gates permission prompts | agent-guard deterministic equivalent |

## The honest delta

Not features we're missing so much as **two architectural habits**:
(1) they run the agent *inside* surfaces — PR comments, issue triage,
security checks as Actions — our agent only runs in-session;
(2) advisor/second-model consults *mid-task* — our judgment all happens
at the gate, after the work. A mid-task consult ("should I doubt this
approach?") is the doubt-driven-development skill made structural.
