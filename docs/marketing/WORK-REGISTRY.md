# WORK-REGISTRY

Status: `living` · Owner: TL · Rule: a work order (WO) is closed only with recorded evidence (commit SHA + gate result). No task is complete merely because an agent reports it finished.

## Ownership model

| Role | Owns |
|---|---|
| **TL** | Runtime boundary, fork baseline, architecture lock, interface contracts, product-level integration, regression gates, release acceptance, conflict resolution. Shared files are TL-owned; assigned to one worker at a time. |
| **Worker A** | Platform access & connectors: access verification, acquisition/publishing adapters, pagination/retries, access-state reporting, source-coverage matrix (`MARKETING-DATA-SOURCES.md`). |
| **Worker B** | Temporal data & analytics infrastructure: ingestion, normalized records, observations, snapshots, provenance, historical replay, idempotency, persistence tests. |
| **Worker C** | Marketing intelligence & creative experience: feature extraction, performance analysis, cross-source patterns, evidence-backed briefs, evaluation fixtures, marketing UI surfaces. |

Workers integrate through reviewed contracts and test fixtures, not unstructured chat assumptions.

## Active work orders

### W0 wave

| WO | Title | Owner | Status | Evidence / notes |
|---|---|---|---|---|
| WO-001 | Fork mechanics: create public repo, copy all refs from `zai-org/zcode` | TL | ✅ done | Repo `payswapdotorg/signalloop`; branches `main`+`feat/ui-plugin`, tags `v3.14.3`/`v3.15.1`; HEAD parity `3c5b227`. History/LICENSE/NOTICE preserved. |
| WO-002 | W0 upstream audit + governance docs (`docs/marketing/`, 10 files) | TL | ✅ done | This doc set; paths spot-verified against checkout. |
| WO-003 | Contracts package `packages/marketing` (W1 freeze) | TL | ✅ done (this session) | Module artifacts per golden-module; registered in `architecture-policy.yaml`; root typecheck list updated. **Gates green (scoped)**: package `tsc --noEmit` ✅ · `tsc -b packages/marketing` composite ✅ · vitest 8/8 ✅ · oxlint 0/0 ✅ · oxfmt ✅ · `architecture:check --changed` ✅ · `test:architecture` 36/36 ✅ · `db:schema:check` 8/8 ✅. |
| WO-004 | Capture full `verify:pre-push` + CLI-suite baseline in build-capable environment | TL | 🔶 blocked (env) | Sandbox limits observed honestly: monorepo-wide root `tsc -b` aborts on memory (SIGABRT) and `pnpm knip` OOMs (oxc-parser buffer) — **environment constraints, not code findings**. Remaining full-suite gates (root typecheck, knip, desktop E2E, CLI suite) must run in CI/dev workstation; command list = `MARKETING-ARCHITECTURE-LOCK.md` §4.4. |
| WO-005 | zh translations of marketing docs (repo bilingual convention) | TL | 📅 W7 | English-canonical until then; keep files' zh/en split like upstream when translated. |

### W1 wave

| WO | Title | Owner | Status | Evidence / notes |
|---|---|---|---|---|
| WO-101 | Access-path probes + conformance smoke: Meta Ad Library (ads), YouTube Data API (organic), TikTok portals | Worker A | ✅ done (probe stage) | `MARKETING-DATA-SOURCES.md` §1 (date-stamped, with API error semantics). Authenticated smoke pending credentials → WO-102. |
| WO-102 | Authenticated connector smoke tests (token/key in credential storage; quota + rate-limit behavior recorded) | Worker A | ⏳ pending creds | Also records metric-semantics versions per source into `MARKETING-DATA-SOURCES.md`. |
| WO-103 | Marketing MCP plugin skeleton (`apps/zcode-cli/packages/marketing-plugin/`): manifest, tool stubs per `MARKETING-CAPABILITY-MAP.md`, conformance tests per `PLATFORM-CONNECTOR-CONTRACT.md` §5 | Worker A | 📅 next | Registration via `official-plugin-definitions.ts` deferred to first real tool. |
| WO-104 | Security boundary review of plugin path vs built-in tool path (decision record) | TL | 📅 with WO-103 | Default: plugin-first per architecture lock §2. |

### W2 wave (temporal foundation — Worker B)

| WO | Title | Owner | Status |
|---|---|---|---|
| WO-201 | Marketing SQLite DB (`~/.zcode/v2/marketing.sqlite`): repos + migrations + `schema.baseline.sql`; register in `scripts/check-sqlite-schema.ts` | Worker B | ⏳ |
| WO-202 | Idempotent snapshot ingestion (read-path dedupe on snapshot identity) + double-ingest test | Worker B | ⏳ |
| WO-203 | As-of query/replay (`TemporalMode.replay`) + observation immutability tests | Worker B | ⏳ |
| WO-204 | Coverage ledger persistence + "honest conclusion" renderer contract test | Worker B | ⏳ |

### W3 wave (first end-to-end workflow — Worker C + A)

| WO | Title | Owner | Status |
|---|---|---|---|
| WO-301 | Mission onboarding tool (`mission.create`) + `ProductBrief` persistence | Worker C | ⏳ |
| WO-302 | Competitor discovery + user-correction tools (`competitors.*`) with identity confidence | Worker C | ⏳ |
| WO-303 | First two connectors (Meta Ad Library API; YouTube Data API) implementing the connector contract | Worker A | ⏳ |
| WO-304 | Creative feature extraction pipeline (capability 2.4) + versioned fixtures | Worker C | ⏳ |
| WO-305 | Cross-source scoring engine (4 separated scores, in code) + RQ evals RQ-1..RQ-5 | Worker C | ⏳ |
| WO-306 | Evidence viewer UX in existing client surfaces | Worker C | ⏳ |

### W4–W6 (charted, detailed WOs at wave start)

Brief generation & prompt packs (C) · asset validation (C) · publication approval + adapters (A) · measurement collection (A/B) · forecast pre-registration, calibration, backtesting, next-experiment recommender (B/C). All gated per `MARKETING-EVALUATION.md` §5.

## Shared-file ownership (current)

| File | Current owner |
|---|---|
| `architecture-policy.yaml`, root `package.json` (typecheck list), `docs/marketing/*` | TL |
| `packages/marketing/**` | TL (contracts) — changes require TL review |
| `apps/zcode-cli/packages/marketing-plugin/**` | Worker A (plumbing) + Worker C (intelligence tools) |
| `scripts/check-sqlite-schema.ts` registration rows | Worker B (marketing rows) + TL (review) |

## Session log

- **2026-10-28** (TL session): WO-001/002/003 + probe stage of WO-101 completed. Fork established with full upstream history; W0 audit + 10 governance docs + `packages/marketing` contracts committed (SHAs recorded in git history of this repo); access probes date-stamped. WO-004 documented as environment-blocked with exact command to run. Next: WO-103 plugin skeleton → W2 wave.
- **2026-10-28** (verification note): scoped gates all green (see WO-003 evidence). Full-scope `architecture:check` surfaces one pre-existing upstream violation (`gen-ui-service` missing `contract.test.ts`) — upstream condition at `3c5b227`, preserved untouched, flagged for upstream reconciliation.
