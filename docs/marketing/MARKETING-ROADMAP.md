# MARKETING-ROADMAP

Status: `living` · Owner: TL · Wave model: gated; each wave must demonstrably work before the next starts.

Sequencing principle: **build one complete, measurable journey before building ten partial platform integrations.** First platform/ad source selection follows the W1 access tests, with market and geography explicitly defined.

## Current position

- **W0 — complete** (this fork): upstream audit, preservation baseline, governance docs, fork mechanics (full history preserved: `main` + `feat/ui-plugin`, tags `v3.14.3`/`v3.15.1`). Runtime *build* demonstration is environment-dependent and tracked as `WO-004`.
- **W1 — in progress**: domain contracts frozen (`packages/marketing`), source-coverage model, capability-routing design, security boundaries; access-path probes done for Meta Ad Library API (ads) and YouTube Data API (organic) — see `MARKETING-DATA-SOURCES.md` §1.

## Waves

### W0 — Upstream audit & preservation baseline ✅
Exit gate: TL demonstrates the existing runtime and documents capabilities that must remain intact. → `FEATURE-PRESERVATION-MATRIX.md` (matrix complete); runtime build demo pending `WO-004` (needs a full install environment).

### W1 — Architecture contracts & data-access proof 🟡
Freeze marketing domain contracts, source-coverage model, capability-routing design, security boundaries. Test real access paths before making sources foundational.
Exit gate: ≥1 viable organic source + ≥1 suitable ad-intelligence source with verified access paths and repeatable test results. → **Met** (probes + conformance suite in `WO-101`); authenticated smoke tests pending credentials (`WO-102`).

### W2 — Temporal data foundation
Connector framework, normalized entities, provenance, immutable metric observations, historical snapshots, coverage reporting; backfill where permitted.
Exit gate: double-ingesting the same evidence is safe; metric changes are recorded; an as-of query reproduces the observations actually available at that time.
Owner: Worker B (`WO-2xx`). Persistence strictly per `MARKETING-DATA-MODEL.md` §3.

### W3 — First end-to-end intelligence workflow
Product onboarding, competitor discovery, platform research, evidence viewer, creative feature extraction, cross-source opportunity ranking — in the existing ZCode UX surfaces via the marketing plugin tools.
Exit gate: a user can describe a product, choose a platform, and see an evidence-backed report with explicit data gaps and explainable creative opportunities.
Owner: Worker C (intelligence UX + tools) + Worker A (first two connectors).

### W4 — Creative strategy & production handoff
Structured creative brief, generator-specific prompt packs (Higgsfield + compatible tools), scripts/storyboards, testable hypotheses; asset upload, comparison, validation.
Exit gate: user takes a recommendation into a creative platform, produces an asset, brings it back into the same mission.

### W5 — Authorized publishing
Platform publishing adapters (organic only first), consent handling, approval controls, post-status verification, publication records; assisted/manual path for unsupported platforms.
Exit gate: publishes a user-approved asset through a connected test account, verifies the resulting post, records its identity. `paid_ads` domain stays out of scope.

### W6 — Measurement & closed-loop learning
Permitted analytics collection, actual-vs-forecast comparison, evaluation/backtesting, model-calibration correction, next-experiment recommendation.
Exit gate: ≥1 measured content experiment completes and produces a subsequent recommendation grounded in the recorded result.

### W7 — Production hardening & integration expansion
Reliability, quotas, recovery, tenant isolation, source coverage, performance, usability; additional platforms per demand **and** verified access.
Exit gate: full workflow passes security, regression, integration and product-acceptance suites; zh doc translations complete.

## Dependencies

```
W0 ──► W1 ──► W2 ──► W3 ──► W4 ──► W5 ──► W6 ──► W7
        │              ▲                      │
        └─ contracts ───┘   (W3 consumes      └─ W7 may add connectors,
           frozen in W1      W1+W2 artifacts)    each re-entering W1's
                                                 ledger process per source
```

## First true release milestone (definition of done)

One demonstrable loop: **product brief → real research → evidence-backed opportunity → creative prompt → user-created asset → approved publication → measured result → revised recommendation.**

## Known risks & mitigations

| Risk | Mitigation |
|---|---|
| Data access narrower than ambition | Connector-neutral contracts; coverage ledger; assisted workflows; first sources chosen by verified access (already enforced in W1). |
| Runtime drift breaking upstream merges | Architecture lock + preservation matrix + `verify:pre-push` at every merge; upstream re-sync re-audits. |
| Governance friction (unmanaged-new-file, knip) | `pnpm architecture:adopt` before code; register in root typecheck list; document exceptions with reasons. |
| Model-routing over-engineering | Capability routing is a thin selection layer over the existing provider registry; recorded decisions; no bespoke runtime. |
| Evidence over-claim under time pressure | RQ evals are merge gates, not aspirations (`MARKETING-EVALUATION.md` §5). |
