# MARKETING-NORTH-STAR

Status: `frozen` (W1) · Owner: TL · Upstream commit at freeze: `3c5b227649371507ddc4eb46ac5133afe6db1cab`

This file is the authoritative statement of what SignalLoop — the marketing-intelligence product built inside this ZCode fork — is for. Every other `docs/marketing/*` file derives from it. When they conflict, this file and `MARKETING-ARCHITECTURE-LOCK.md` win.

## 1. Product thesis

ZCode is a general-purpose agent workspace. SignalLoop evolves this fork into a **self-organizing marketing intelligence and execution workspace**: a harness that turns real, attributable evidence about ads and organic content into creative decisions, publishes them with explicit approval, and learns from measured outcomes.

The defining capability is **one continuous learning cycle**:

1. **Define the mission** — product, audience, country, platform, offer, desired outcome.
2. **Discover the landscape** — ad libraries, competitor creatives, organic content, trends, authorized account analytics.
3. **Find the winning intersection** — what appears effective in paid advertising × what resonates in organic content.
4. **Generate an evidence-backed creative brief** — angle, hook, script, format, visual direction, CTA, production prompt.
5. **Create, review, publish** — creative generation tools, user-made assets, approval-gated publishing.
6. **Measure, learn, improve** — actual outcomes vs. predictions → corrected hypotheses → the next experiment.

Every cycle must leave behind evidence that makes the next cycle cheaper and better. The durable advantage is the **temporal record** (see `MARKETING-DATA-MODEL.md`): what we observed, when, under which coverage conditions, what we concluded, what we predicted, and how the prediction scored.

## 2. User journey (first release)

The first true release milestone is **one demonstrable loop**:

> product brief → real research → evidence-backed opportunity → creative prompt → user-created asset → approved publication → measured result → revised recommendation

Concretely, a user of the ZCode workspace (CLI/TUI or web):

1. Describes a product and marketing goal (mission onboarding — stored as a `ProductBrief`).
2. Runs a research mission; the agent plans the run from the capability catalog, queries eligible sources, and reports results together with a **coverage ledger** stating exactly what is verified, estimated, unavailable, or not connected.
3. Reviews ranked creative opportunities, each with observed performance, cross-source support, predicted performance, and confidence — plus explicit missing-data callouts and contrary examples.
4. Receives a structured creative brief (intent, storyboard/script, generator prompt pack, experiment spec) usable in Higgsfield or any other production tool.
5. Brings the produced asset back; the harness validates it against the brief and platform constraints.
6. Approves an exact publication package (content, account, destination, time, disclosures). Publishing never happens without explicit authorization; organic publishing and paid advertising are separate permission domains.
7. Watches measurements accumulate against the pre-registered forecast, then receives a learning report: deviation, failed/supported assumptions, calibration update, and the next experiment recommendation.

## 3. Product goals

- **G1 — Evidence integrity.** Every material recommendation is traceable to stored evidence records with provenance and confidence. The system never claims "all ads discovered," "the highest-converting creative," or "the best-performing strategy" unless the evidence supports it. Unknowns are displayed, never invented.
- **G2 — Temporal correctness.** Observations are immutable and idempotent; re-ingesting the same source record never creates phantom creatives or inflated metrics. As-of queries reproduce the evidence available at any past time. Forecasts are stored before outcomes and scored against actuals.
- **G3 — Runtime preservation.** The existing ZCode runtime (agent loop, tool execution, provider routing, sessions, permissions, tasks/subagents, clients) continues to work unchanged. Marketing is a domain layer on top, not a fork of the engine.
- **G4 — Capability-driven routing.** Models and tools are selected per task from declared capabilities (text/vision/audio/video/generation/tool-use), with cost, latency, and reliability metadata; selection is recorded; fallbacks are explicit.
- **G5 — Publishing safety.** Authorization is explicit, scoped, and audited. Retries cannot create duplicate publications. Credentials never enter prompts, logs, or generated artifacts.
- **G6 — Closed-loop learning.** The system optimizes the user's chosen business outcome (awareness → sales), not raw engagement. It resists overfitting: comparable variants, controlled differences, accumulated observations before strong claims.

## 4. Non-goals

- **N1 — Not a general agent framework.** No second planner loop, conversation engine, subagent framework, scheduler, or persistence stack. The existing runtime provides these.
- **N2 — Not a scraping black-hat tool.** No authentication bypass, CAPTCHA circumvention, rate-limit evasion, or ToS violation. A logged-in browser is not permission to extract unlimited data. Where a platform offers no API, we surface honest "unavailable" coverage and assisted (manual) workflows instead of silent scraping.
- **N3 — Not a universal ad archive.** No connector claims universal coverage. The coverage ledger is part of every research result.
- **N4 — Not a copy machine.** The system identifies reusable strategic patterns and produces original work serving the user's product, brand, and constraints.
- **N5 — No paid-ad spend without its own approval domain.** Approving an organic post never authorizes budget spend.

## 5. Measurable outcomes (product-level)

| Dimension | Metric | Target (first release) |
|---|---|---|
| Research integrity | % of recommendations with full evidence lineage | 100% |
| Coverage honesty | Research runs with a rendered coverage ledger | 100% |
| Temporal correctness | Duplicate-ingestion incidents creating phantom records | 0 (verified by idempotency tests) |
| Prediction discipline | Experiments with pre-registered forecast before publication | 100% |
| Learning quality | Experiments producing a next-action recommendation referencing recorded evidence | 100% |
| Runtime preservation | Upstream regression suites green at each merge | baseline preserved (see `FEATURE-PRESERVATION-MATRIX.md`) |
| Loop completion | Demonstrated end-to-end loop on ≥1 platform | 1 (vertical slice) |

## 6. Scope decisions locked at W1

- **First geography/platform selection** happens only after the W1 access tests; connectors are chosen by *verified access path*, not by ambition.
- **Connector-neutral architecture**: the domain layer depends on `SourceDescriptor` contracts, never on a specific vendor SDK. The first release ships a deliberately small number of fully tested connectors.
- The blueprint's wave plan (W0–W7), gates, and ownership live in `MARKETING-ROADMAP.md` and `WORK-REGISTRY.md`.
