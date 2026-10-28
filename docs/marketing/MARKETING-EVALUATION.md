# MARKETING-EVALUATION

Status: `frozen` (W1) · Owner: Worker C (with TL) · Applies to: all waves; gates defined in §5

"No task is complete merely because an agent reports that it finished" — and no recommendation is good merely because the model sounds confident. This file defines how SignalLoop's outputs are judged, with versioned evaluation sets and measurable gates.

## 1. Research-quality benchmarks (intelligence layer)

Evaluated against a **versioned fixture set** (checked into the repo; fixtures are synthetic or licensed, never scraped dumps):

| Eval | What it checks | Pass bar |
|---|---|---|
| RQ-1 Competitor resolution | Candidate lists on known product fixtures: precision/recall vs. annotated ground truth. | Precision ≥ 0.8, recall ≥ 0.7 on v1 fixtures; identity confidence calibrated (below). |
| RQ-2 Deduplication & aliasing | Same advertiser under name variants resolves to one entity; no phantom creatives. | 0 phantoms on adversarial fixture (near-duplicate ads). |
| RQ-3 Coverage honesty | Runs with seeded connector errors must render the implied coverage states and conclusion strength — no "complete" claims from partial data. | 100% of seeded-error scenarios render correct states (matches `PLATFORM-CONNECTOR-CONTRACT.md` §5.3). |
| RQ-4 Velocity vs totals | Comparing a 2-day-old post against a 6-month-old post by raw totals is a fixture failure. | Velocity-normalized comparisons only; fixture ≥ 95% correctly ranked. |
| RQ-5 Signal-laddering | Long-running ads are reported as signals, never as proof of profitability; views ≠ conversions. | 100%: generated reports never make unsupported causal claims (pattern-checked + human-audited sample). |

## 2. Creative-quality assessment

- **Versioned brief evaluation set**: product fixtures × objectives; the brief generator (capability 2.5 → brief) is scored on:
  - **Usability**: a creative producer can execute the brief without asking clarifying questions (rubric: hook clarity, scene specificity, CTA presence, format/platform fit).
  - **Fidelity**: offer/audience/brand constraints from the `ProductBrief` are respected.
  - **Originality guard**: outputs share strategic patterns with, but do not copy, competitor creatives (similarity heuristics + human audit).
- **Asset validation checks** (pre-publication): opening communicates intended benefit; product representation accurate; planned proof present; CTA matches the goal; platform technical/policy requirements met; factual claims verified; brand constraints enforced. All checks are recorded on the artifact.
- Comparisons are against a **documented baseline** (e.g., hand-written briefs), not subjective inspection of a single output.

## 3. Scoring discipline (encoded in code, G4/G6)

Four separated scores on every ranked opportunity — **never one blended number**:

1. **Observed performance** — what the evidence directly says (velocity-normalized, goal-relative metrics).
2. **Cross-source support** — how consistently the pattern appears across independent eligible sources (ads × organic).
3. **Predicted performance** — the model's estimate for this product/objective, bounded by evidence quality.
4. **Confidence** — completeness, comparability and statistical informativeness of the evidence (sample size, coverage gaps, comparability controls).

Every recommendation ships with an explanation including **contrary examples and missing data**. Rankings may use calibrated/statistical models as evidence accumulates; no fixed scoring formula embedded permanently inside a giant prompt.

## 4. Forecast calibration (learning loop)

- **Pre-registration**: before publication, store the forecast (predicted range, assumptions, baseline) — `SimulationRun`. No experiment proceeds without one.
- **Scoring**: after the measurement window, record the actual, compute deviation vs. range, and maintain a calibration table (per metric family: hit rate within range, mean absolute error, systematic bias direction).
- **Backtesting**: replay historical experiments against the current forecaster; forecast error and calibration must be non-degrading across versions.
- **Assumption ledger**: each experiment records which assumptions were supported/contradicted; the next recommendation must reference this ledger rather than repeating the previous output.
- **Overfitting resistance**: single successes never become laws. When practical: comparable creative variants, controlled differences, accumulated observations before strong claims.

## 5. Acceptance gates (superset of North-Star §5)

| Gate | Criterion | Verified by |
|---|---|---|
| Runtime preservation | Upstream suites green at merge; architecture check clean | `pnpm verify:pre-push` + CLI suite |
| Research integrity | 100% of material recommendations traceable to evidence records | RQ eval suite + lineage audit |
| Historical correctness | Repeat ingestion is a no-op; as-of queries replay recorded evidence | W2 contract tests |
| Creative quality | Brief eval ≥ baseline on the versioned set | W4 eval run |
| Publishing safety | No publish without authorization; retries idempotent; secrets out of prompts/logs/artifacts | W5 security tests + permission-broker tests |
| Learning quality | Forecasts stored pre-publication (100%); calibration non-degrading; next action references evidence | W6 backtest suite |
| Operational reliability | Lint/type/architecture/unit/integration green | repo gates |

## 6. Evaluation cadence

- Every wave exit runs the relevant suite and records results in `WORK-REGISTRY.md` under the owning work order.
- Fixtures are versioned; adding fixture cases is a PR with rationale (no silent difficulty changes).
- Human audit remains mandatory for RQ-5 and the originality guard until automated checks are validated for two consecutive waves.
