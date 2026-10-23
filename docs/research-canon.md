# Research canon — the papers that actually matter (Oct 2026)

The reading list for "what is the field actually converging on." Foundational ≠
recent; each entry earns its slot by being *the* thing its area still cites.

## Meta-claims (read first — they're essays, not results)

| Paper | Why |
|---|---|
| Sutton, "The Bitter Lesson" (2019) | General methods + compute beat hand-crafted knowledge — the frame everything else sits in |
| Sutton & Silver, "The Era of Experience" (2025) | Next shift: agents learning from experience streams, not static data — the theoretical basis for everything in §agents/memory below |
| METR, "Measuring AI Ability to Complete Long Tasks" (2025) | Task-length doubling ~every 7 months — the capability meta-metric labs quote |

## Reasoning & RL — where capability actually comes from

| Paper | Why |
|---|---|
| DeepSeek-R1 (arXiv:2501.12948) | Open recipe for RLVR reasoning — GRPO, emergent long-CoT, distillation works |
| "Scaling LLM Test-Time Compute" (Snell et al. 2024) | Inference-time scaling as a first-class axis |
| "s1: Simple test-time scaling" (arXiv:2501.19393) | Budget-forcing: 1k samples + wait-token = near-frontier — the cheap-reasoning proof point |
| "Let's Verify Step by Step" (OpenAI 2023) | Process reward models — still the PRM reference |
| Continual Reasoning Gym (arXiv:2608.18574, Aug 2026) | Continual RLVR — forgetting vs shared-reasoning transfer, the frontier question |

## Agents & harnesses — **the current research edge is literally our domain**

Oct 2026's active front: the model stays frozen and the **harness**
(prompts, memory, skills, routing) is what learns. These define the field
this repo operates in:

| Paper | Why |
|---|---|
| **Harness Continual Learning (HCL)** (arXiv:2608.19013) | Formalizes it: Task Interface + Experience Memory + Capability Map + Adaptive Router + *guarded* evolution (propose→evaluate→commit). Our ledger/state.json/gates are a hand-built version of this |
| **ReHarness** (Meta, arXiv:2610.12668, Oct 2026) | Backward revision of harness state — after each trajectory, revise what SHOULD have been retrieved. Memory-write refinement, online |
| **Memory-Centric Continual Learning (MCCL)** (arXiv:2610.29357) | Memory judged by *improving future actions*, not recall — the metric our experience-bank design needs |
| "Are Self-Evolving Agents Continual Learners?" (arXiv:2610.25858) | Nonparametric self-editing agents (ReasoningBank, GEPA) tested on drifting task streams — the honest eval of the pattern |
| ReAct (arXiv:2210.03629), Reflexion, Toolformer | The reason+act / self-critique / tool-use primitives everything else composes |
| Generative Agents (Stanford) | Memory stream + reflection + planning — the original "agent as memory system" |
| Anthropic: "Building effective agents", "Writing tools for agents", "Context engineering" | The engineering doctrine papers-of-record for harness design |
| OpenAI "A practical guide to building agents" | The parallel doctrine |
| `dexhorthy/twelve-factor-agents` | The 12-factor canon — own your context window, tools as structured output |

## Memory & context

| Paper | Why |
|---|---|
| Titans (Google, arXiv:2501.00663) | Neural memory module — test-time learning inside the architecture |
| MemGPT/Letta, Mem0, A-MEM, MemT | The memory-system lineage → covered in `agent-memory.md` |
| "Lost in the Middle" | Why long context ≠ usable context — the original warning |

## Multimodal & world models

| Paper | Why |
|---|---|
| CLIP, Flamingo | The alignment/VLM foundations |
| DiT + flow matching lineage | The video/image-gen backbone (Sora, Veo, Wan all descend) |
| Genie 2/3 (DeepMind) | Video as interactive world model — generative envs, not just pixels |
| RT-2 → OpenVLA → π0 → GR00T N → Helix | The VLA (vision-language-action) line — policy models for physical AI; the actual physical-ai canon if that direction resumes |

## Efficiency & systems

| Paper | Why |
|---|---|
| FlashAttention 1–3 | IO-aware attention — the single most load-bearing systems paper |
| PagedAttention (vLLM) | KV-cache paging — made serving cheap |
| Muon (Keller Jordan; Kimi K2 used MuonClip) | The optimizer story of 2025-26 |
| DeepSeek-V3 (arXiv:2412.19437) | MLA + MoE + FP8 — the efficiency-at-frontier recipe |
| Speculative decoding | Draft-and-verify — default inference trick |

## Interpretability & alignment (the Anthropic corpus)

| Paper | Why |
|---|---|
| Transformer Circuits framework + Toy Models of Superposition | The mech-interp base |
| Scaling Monosemanticity (Golden Gate) | Features are real, steerable |
| "On the Biology of a Large Language Model" (2025) | Circuit tracing at production scale — attribution graphs |
| Sleeper Agents; Alignment Faking; Emergent Misalignment; CoT faithfulness | The deceptive-capability cluster — models that hide, fake, and narrow-tune into broad misalignment. Required reading before trusting agent autonomy |
| Constitutional Classifiers; AI Control (Greenblatt) | The defense side of the same coin |

## Eval science

| Paper | Why |
|---|---|
| SWE-bench (Verified), τ²-bench, GAIA, HAL, OSWorld, Terminal-Bench | The benchmark ladder — `agent-standards.md` has the tooling side |
| ARC-AGI / ARC-AGI-2 (Chollet) | The abstraction benchmark — the one frontier models still argue about |
| UK AISI Inspect | The eval *framework* — build your own suite |

## How to use this canon

Not homework — a lookup table. When a design question lands
("should memory update weights?", "is our gate like HCL's guarded
evolution?"), the answer's prior art is here. The Oct-2026 frontier is
unusually aligned with this repo: **the field is discovering that the
harness is the learning surface** — which is the entire premise.
