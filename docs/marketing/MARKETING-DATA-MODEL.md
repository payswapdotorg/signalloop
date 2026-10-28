# MARKETING-DATA-MODEL

Status: `frozen` (W1) · Owner: Worker B · Contracts: `packages/marketing/src/records`

The canonical records are **domain contracts** (zod schemas + TypeScript types), not eleven unrelated database systems. Related records stay cohesive; persistence follows the repository's established SQLite patterns.

## 1. Canonical records (11)

| # | Record | Purpose (one line each) |
|---|---|---|
| 1 | `ProductBrief` | Product, audience, market, offer, objective, constraints — the mission's grounding document. |
| 2 | `CompetitorEntity` | Identified companies/brands/sellers/accounts/landing pages with identity confidence, relevance reason, and user-correctable status. |
| 3 | `AdCreative` | Observable ad content: advertiser, creative variations, format, source identifiers, first/last observed. |
| 4 | `OrganicContent` | Public content: author/account, format, publication timestamp, available metadata. |
| 5 | `MetricObservation` | **Immutable**: one metric value at one observation time, with source, metric definition and connector version. |
| 6 | `CreativeFeatureSet` | Extracted hooks, topics, formats, messages, narrative structures, CTAs — each feature citing its evidence span. |
| 7 | `EvidenceRecord` | Source reference, observation period, provenance, access method, confidence — the lineage unit for every material claim. |
| 8 | `CreativeHypothesis` | Proposed strategy + supporting evidence + predicted outcome + explicit uncertainty. |
| 9 | `CreativeArtifact` | Generated prompt, storyboard, script, uploaded asset, approved version. |
| 10 | `ExperimentRecord` | Hypothesis, variants, publication details, goal, measurement window, result. |
| 11 | `SimulationRun` | Forecast assumptions, model/version, projected outcome range, calibration info — kept separate from observed history. |

Common rules:

- Every record is mission-scoped (`missionId`) and evidence-terminated: records that support recommendations link `EvidenceRecord`s.
- Records keep `sourceRecordId` (identity in the upstream system) **in addition to** any local id. Resolution to canonical entities is a separate, reversible step.
- Schemas are additive-only once frozen; field changes get new optional fields + a data-model note in this file.

## 2. Temporal semantics (the time machine)

Three kinds of time, never conflated:

- `observedAt` — when the measurement/fact was actually taken (from the source when possible).
- `publishedAt` — the source's event time (post/ad publication).
- `ingestedAt` — when our pipeline stored it (local wall clock).

Plus: `TemporalMode` ∈ { `live` (monitoring), `replay` (historical reconstruction of what *we* observed), `counterfactual` (forecasts — stored separately from facts, via `SimulationRun`) }.

Supporting fields retained on observations: connector version, metric semantics/definition version, applicable region, retention restrictions on source data.

### 2.1 Idempotency (G2)

- Snapshot identity = `(missionId, sourceId, sourceRecordId, observedAt, metricKey)`. Ingesting the same record again must be a no-op: no new creative, no metric inflation. Changes are **new observations or explicit revisions**, never silent rewrites.
- Publisher identity is idempotent on `(missionId, artifactVersion, destination)` — a retried publication can never create a duplicate post.

### 2.2 Honest limits

The time machine reconstructs **what the system observed**, not what it never recorded. Missing history is only fillable from eligible archives, licensed sources, or user-supplied historical reports — and then stored with `accessMethod` provenance. This limitation is disclosed in-product, not footnoted.

## 3. Persistence strategy (follows repo patterns exactly)

- **Storage engine**: `node:sqlite` (`DatabaseSync`) — no ORM, matching the repository's established pattern (see `MARKETING-ARCHITECTURE-LOCK.md` §2).
- **Database placement**: a dedicated marketing database (`~/.zcode/v2/marketing.sqlite`, path via `packages/services/src/paths.ts` conventions), keeping mission data separate from session/task indexes; the mission index may mirror minimal lookup rows into the tasks-index DB only if the UI requires it (decision deferred to W2, one owner — Worker B).
- **Migrations**: `SqliteMigration[]` entries (`appVersion`, `id`, `touchedTables`, `sql`) through the shared runner `packages/shared/src/sqlite-migrations/`.
- **Repos**: `ensureReady()` + explicit migrations, modeled on `packages/services/src/session/automationRepo.ts` / `taskIndexRepo.ts`.
- **Schema contract**: commit `schema.baseline.sql`; register the repo + baseline in `scripts/check-sqlite-schema.ts`; additive-only enforced by `pnpm db:schema:check`.
- **Record cohesion**: related records share tables where natural (e.g., observations are one table; creative features may live as a feature-set JSON column on the target reference with typed zod validation at the boundary).

## 4. Metric definitions & scoring inputs

- `MetricObservation` carries `metricKey` + `metricDefinitionVersion` (platform definitions change; retain raw values, not only derived scores).
- Goal-relative measurement (per North-Star G6):

| Goal | Preferred measurements (where available) |
|---|---|
| Awareness | Reach, impressions, qualified views |
| Engagement | Shares, saves, meaningful comments, applicable engagement rates |
| Traffic | Outbound clicks, landing-page visits |
| Leads | Qualified leads, cost per lead |
| Sales | Attributed purchases, conversion rate, revenue, acquisition cost |
| Retention | Returning customers, repeat purchases, customer lifetime value |

- Competitor conversion/purchase/spend data is usually unavailable; observable signals are **labeled as such**. Organic comparison normalizes by account size, content age, format, publication period, paid-vs-organic status; velocity comes from repeated snapshots.
- Ad longevity is a **clue**, never proof of profitability. These distinctions live in code (`packages/marketing/src/records` + scoring engine in W3), not in model prompts.

## 5. Coverage ledger & evidence graph

- Every research run ends with a `CoverageReport` per source/dimension (states: available / limited / unavailable / not_connected; provenance: verified / estimated / reported / simulated) and a **conclusion strength** statement the UI renders verbatim (e.g., "sufficient for a preliminary creative hypothesis; insufficient to rank competitors by ROAS").
- Evidence records support a graph: creative → features → hypothesis → brief → artifact → experiment → outcome → next experiment. `MARKETING-EVALUATION.md` defines how lineage completeness is audited.
