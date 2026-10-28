# MARKETING-CAPABILITY-MAP

Status: `frozen` (W1) · Owner: TL (map), Worker C (intelligence), Worker A (connectors), Worker B (data)

The marketing intelligence layer consists of **logical capabilities**, not six persistent agents. The existing runtime decides which capabilities to invoke, which can run concurrently (subagents), which need more evidence, and which model class fits each step. This map binds each capability to its runtime seam (paths verified at W0; see `MARKETING-ARCHITECTURE-LOCK.md` §2).

## 1. The domain contracts package (foundation for all capabilities)

`packages/marketing` (managed module, pure domain contracts, zod-only) exports:

| Area | Contents | Primary consumers |
|---|---|---|
| `records/` | The 11 canonical records + evidence + coverage ledger schemas (`MARKETING-DATA-MODEL.md`) | all capabilities, persistence, UI |
| `connector/` | `ConnectorDescriptor`, capability declarations per permission domain, typed errors, idempotency keys, source descriptors | Worker A connectors, tools |
| `capability/` | Task/capability catalog + routing decision contracts riding on `packages/shared/src/model-config.ts` properties | runtime routing (G4) |
| `temporal/` | observed_at / published_at / ingested_at semantics, as-of queries, snapshot identity | persistence, time machine |
| `coverage/` | Coverage states, ledger assembly, honest-conclusion rules | research, UI |
| `contract.ts` | Narrow public port (`MarketingIntelligencePort`) | runtime, services |

## 2. Capability → runtime mapping

### 2.1 Product & market researcher
Converts the user's product description, landing page, offer and objectives into a `ProductBrief`, `MarketMap` view and `CompetitorCandidate` list with relevance reasons and identity confidence.
- **Mechanism**: agent loop + MCP tools (`mission.create`, `competitors.discover`, `competitors.correct`), model selected by capability routing (structured extraction).
- **Outputs**: `ProductBrief`, `CompetitorEntity` (status candidate/confirmed/rejected), `EvidenceRecord` for each competitor claim.
- **Notes**: user correction of the competitor list is a first-class operation, not an afterthought (missed competitors materially change strategy).

### 2.2 Ad intelligence researcher
Queries eligible ad libraries, resolves advertiser identities, deduplicates creatives, tracks observable history/variations.
- **Mechanism**: connector tools `ads.search`, `ads.observe` in the marketing MCP plugin; connectors implement `ConnectorDescriptor` with the `research` permission domain only.
- **Outputs**: `AdCreative`, `AdObservation` (delivery/history facts), `CoverageReport` deltas.
- **Notes**: advertiser identity resolution carries confidence scores; aliases are merged, never guessed silently.

### 2.3 Organic content intelligence researcher
Finds relevant content on the selected platform, clusters topics/formats, compares performance on comparable posts and observation windows (velocity, not raw totals).
- **Mechanism**: connector tools `organic.search`, `content.observe`; platform connectors declare `research` (+ optional `analytics` after user OAuth).
- **Outputs**: `OrganicContent`, `TopicCluster`, `MetricObservation` series, `PerformanceSignal`.
- **Notes**: like-with-like comparison (account size, age, format, period, paid-vs-organic) is computed in code, not entrusted to a model (goal-relative rankings per `MARKETING-EVALUATION.md` §3).

### 2.4 Creative intelligence analyst
Analyzes video/image/audio/captions/transcripts into reusable creative structure — not scene summaries.
- **Mechanism**: capability routing selects multimodal-capable models via `packages/shared/src/model-config.ts` (`inputFormat.supportsImage/sVideo/sAudio`) and provider registry; deterministic preprocessing aligns visual events with transcript/audio timestamps where the source permits.
- **Outputs**: `CreativeFeatureSet` (hook pattern, story structure, offer/conversion structure, visual/production structure), `EvidenceReference` links.
- **Notes**: every feature claim cites the asset evidence (frame/timestamp/caption span) it came from.

### 2.5 Cross-source strategy analyst
Finds the paid × organic intersection; ranks opportunities; identifies contradictions; proposes original experiments.
- **Mechanism**: runs in the main loop (strong-reasoning model) or as a subagent for large evidence sets; scoring engine is code, not prompt (four separated scores: observed / cross-source support / predicted / confidence).
- **Outputs**: `CreativeHypothesis` (with explanation incl. contrary examples + missing data), ranked opportunity list feeding brief generation.

### 2.6 Publishing & learning operator
Validates finished assets, requests approval, publishes via authorized integrations (or assisted handoff), gathers observations, produces the next experiment recommendation.
- **Mechanism**: tools `publication.prepare` / `publication.request_approval` / `publication.confirm` / `experiment.measure` / `experiment.learn` with `alwaysAsk` + `optionsPolicy: "no-always-allow"`; scheduled measurement via `AutomationPort`; platform callbacks via bots channel pattern.
- **Outputs**: `CreativeArtifact` (validated), `PublicationRecord`, `ExperimentRecord`, `SimulationRun` (forecast + calibration), next-action recommendation.
- **Notes**: retries are idempotent on `(mission, artifact version, destination)` — a retried publish can never duplicate a post.

## 3. Routing rules (capability-based, G4)

- Each task type declares requirements (e.g. caption classification → text extraction, cheap; creative asset analysis → vision/video; strategy synthesis → strong reasoning, JSON-constrained output).
- Selection = cheapest suitable capability meeting quality/reliability requirements; explicit fallback chain; the chosen model/tool, its cost tier, and the reason are recorded on the `ResearchRun`/`EvidenceRecord`.
- No assumption that one model is best at every stage. Low-cost text models classify; multimodal models perceive; retrieval tools establish evidence; strong reasoners synthesize.
- All execution flows through existing runtime mechanisms: tool executor (permissions, timeouts, budgets — `core/src/tool/executor.ts`), command admission (`CommandInbox`), sessions, telemetry (`core/src/telemetry/runtime-telemetry.ts`).

## 4. What is NOT a capability (stays infrastructure)

Credential handling (existing credential service patterns), HTTP egress (adapters), browser control (existing `browser-use-plugin` + `BrowserControlPort`, permission-gated, never a scraping shortcut — see North-Star N2), notifications, UI. Marketing code plugs into these; it does not replace them.
