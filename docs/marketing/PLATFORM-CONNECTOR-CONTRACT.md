# PLATFORM-CONNECTOR-CONTRACT

Status: `frozen` (W1) · Owner: Worker A · Contracts: `packages/marketing/src/connector`

Every data-source or publishing integration implements one contract. The domain layer depends on `ConnectorDescriptor`s, never on vendor SDKs (connector-neutral architecture). Browser automation is **not** a connector bypass — egress goes through adapters, and platform restrictions are respected (North-Star N2).

## 1. Capability declaration (per permission domain)

A connector declares, per domain, one of: `supported` / `not_supported` / `supported_with_scopes` (list of required OAuth scopes/entitlements) / `awaiting_approval`.

| Domain | What it grants | Default |
|---|---|---|
| `research` | Read public ad-library / organic-content datasets via the platform's permitted API surface. | off |
| `analytics` | Read the **user's own** authorized accounts (deeper private metrics). | off |
| `publishing` (organic) | Create/queue organic posts on connected accounts. | off |
| `scheduling` | Set publication time. Implies `publishing`. | off |
| `paid_ads` | Create/spend paid campaigns. **Separate approval, budget caps, audit trail — future scope, not first release.** | off |

**F8 rule**: possession of one capability never implies another. Every tool call surfaces the domain it exercises; the permission system (`alwaysAsk` + `optionsPolicy: "no-always-allow"` for publishing) enforces explicit, scoped user authorization per action.

## 2. Interface essentials (see `packages/marketing/src/connector` for the frozen zod/TS contracts)

```ts
interface MarketingConnector {
  readonly descriptor: ConnectorDescriptor;   // id, platform, capabilityDomains, accessState, quotas, regions, metricSemantics
  readonly access: ConnectorAccessState;     // not_connected | demo | authorized(scopes, accountRef, expiresAt) | expired | revoked
  listCapabilities(): ConnectorCapability[];  // typed per-domain declaration above
  // research domain
  searchAds?(q: AdSearchQuery): PageCursor;      // -> AsyncIterable<AdCreativeRecord>
  searchOrganic?(q: OrganicSearchQuery): PageCursor;
  // analytics domain (own accounts)
  fetchAccountMetrics?(q: AccountMetricsQuery): AsyncIterable<MetricObservation>;
  // publishing domain (organic)
  preparePublication?(p: PublicationDraft): PreparedPublication;   // platform-normalized package, dry-run validation
  requestApproval?(p: PreparedPublication): ApprovalHandle;       // routes into the runtime permission broker
  publish?(h: ApprovalHandle): PublicationResult;                 // idempotent on (missionId, artifactVersion, destination)
  // learning domain (measurement)
  observe?(q: ObservationQuery): AsyncIterable<MetricObservation>; // immutable snapshots with observedAt
}
```

Contract notes:

- **Calls are cursor-based** (`PageCursor`), resumable, and retriable with documented backoff; every result row carries its `sourceRecordId`.
- **Outputs are domain records**, never raw vendor payloads; connector code maps vendor fields into canonical records and retains raw JSON only under provenance-tagged storage where retention rules allow.
- **Every call** returns/updates a `CoverageDelta` so the coverage ledger stays synchronized with reality.
- **Access state is observable**: `accessState` transitions (not_connected → authorized → expired/revoked) are events, and UI renders them; a token expiry degrades coverage honestly, it does not fabricate "no results".

## 3. Typed errors (no stringly-typed failures)

`ConnectorError` is a discriminated union, at minimum:

| Code | Meaning | Required handling |
|---|---|---|
| `auth_required` | No/insufficient credentials for the declared domain. | Render as `not_connected` coverage; offer the authorization flow; never fall back to scraping. |
| `scope_missing` | Authorized but the call needs another scope. | Surface the exact scope; do not retry without re-consent. |
| `quota_exceeded` / `rate_limited` | Platform quota/backoff signal. | Honor `Retry-After`-equivalent; record in coverage; do not hammer. |
| `region_unsupported` | Query outside the connector's declared regions. | Downgrade coverage to `limited` with the region note (e.g., Meta commercial ads EU/UK). |
| `dataset_unavailable` | Platform has no permitted dataset for the request (e.g., TikTok research tools without eligibility). | Coverage `unavailable`; suggest legal alternatives (method 2/3/4 in `MARKETING-DATA-SOURCES.md` §3). |
| `partial_results` | Some pages failed; partial set returned. | Attach per-page provenance; **never** present partial as complete. |
| `upstream_changed` | Schema/semantics drift detected. | Fail loudly in tests; connector version bump; metric-semantics note. |
| `publication_duplicate_blocked` | Idempotency guard triggered on publish retry. | Return existing `PublicationResult` instead of creating a second post. |

Errors are data: they persist into the coverage ledger with timestamps, so a past research run's coverage can be replayed.

## 4. Idempotency & pagination conformance

- Read paths: snapshot identity `(missionId, sourceId, sourceRecordId, observedAt, metricKey)` — re-ingestion is a verified no-op (W2 exit-gate test).
- Write paths: publication identity `(missionId, artifactVersion, destination)`; `publish` is idempotent; retries return the original `PublicationResult`.
- Pagination must be stable under replays: cursors embed the query snapshot (including page size and sort) so a resumed crawl cannot skip/duplicate rows.

## 5. Conformance requirements (merge gate for every connector)

1. **Contract test** against the frozen zod schemas (record validation, error taxonomy, idempotency behavior) — no connector ships without its conformance suite passing.
2. **Capability matrix test**: for each declared domain, positive + negative cases (e.g., analytics-only connector cannot publish; research connector cannot fetch own-account metrics).
3. **Coverage integration test**: a research run with forced connector errors must produce the exact coverage states the errors imply (`auth_required` → `not_connected`, etc.).
4. **Data-source ledger entry** updated with date-stamped, authenticated smoke evidence (`MARKETING-DATA-SOURCES.md` §1 format).
5. **Secrets discipline**: credentials live in the existing credential services/config paths; never in prompts, logs, generated artifacts, or the connector's raw-JSON retention.

## 6. Implementation placement

- Connector implementations are adapter code inside the marketing MCP plugin package (`apps/zcode-cli/packages/marketing-plugin/`), one subdirectory per platform, mirroring `image-search-plugin` structure; heavy domain logic stays in `packages/marketing` (pure contracts + policies) so connectors remain thin mapping layers.
