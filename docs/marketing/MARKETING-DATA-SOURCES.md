# MARKETING-DATA-SOURCES

Status: `living` (re-verify every wave) · Owner: Worker A · Last verified: 2026-10-28 (UTC), from this fork's sandbox

Data access is the biggest product risk (North-Star G1/G3). This file is the **source-by-source ledger of access truth**: what each source is used for, its real constraints, and the verified evidence of its access path. No connector ships before its entry here is complete and re-verified.

## 1. Verified access-path probes (W1 evidence, 2026-10-28)

| Probe | Result | Interpretation |
|---|---|---|
| `GET graph.facebook.com/v21.0/ads_archive?search_terms=test` | HTTP 400, body: `{"error":{"message":"(#100) The parameter ad_reached_countries is required.","type":"OAuthException","code":100}}` | **Live, unauthenticated reachability confirmed**; request validation matches the documented EU/UK `ad_reached_countries` transparency scope. Full queries require an OAuth page/system token. → viable ad-intelligence source (W1 exit gate: met for ads). |
| `GET facebook.com/ads/library/` (web UI) | HTTP 403 (datacenter IP) | Web UI is not a reliable programmatic path; the connector must use the **API**, not the UI. No scraping fallback (North-Star N2). |
| `POST open.tiktokapis.com` (research ad query surface) | HTTP 404 on unauthenticated GET probe; network reachable | Reachability confirmed at network level; actual commercial-content endpoints require an **approved application + credentials**. Not a dependency for first release. |
| `developers.tiktok.com` | HTTP 200 | Documentation portal reachable; approval flow documented. |
| `GET googleapis.com/youtube/v3/videos?part=statistics&id=…&key=invalid` | HTTP 400, body: `{"error":{"code":400,"message":"API key not valid. Please pass a valid API key."}}` | **Live; key-gated**; with a valid key this is the viable organic-content source (W1 exit gate: met for organic). |
| `GET googleapis.com/youtube/v3/search?part=snippet&q=test` (no key) | HTTP 403 | Same service, confirms auth enforcement. |

W1 exit-gate status: **at least one viable organic-content source (YouTube Data API) and one suitable ad-intelligence source (Meta Ad Library API) have verified, repeatable access paths** (authenticated runs pending credentials; path + validation semantics proven).

## 2. Source ledger

| Source | Use | Permission & scope reality | Known gaps to respect |
|---|---|---|---|
| **Meta Ad Library API** | Discover eligible ads, advertisers, creative variations, delivery history | Official API covers **commercial ads delivered in EU/UK over the past year**; global 7-year scope applies to **political/issue ads only**. Requires OAuth token. It is **not** a universal commercial archive — never present it as one. | Non-EU/UK commercial delivery, targeting details, spend/conversions of other advertisers, removed ads. |
| **TikTok Commercial Content API** | Search public ads/commercial content + supported advertiser metadata | Requires an **approved application**; documented dataset initially covers **EU** commercial content. | Non-EU coverage; private performance. |
| **TikTok Research Tools** | (Optional) research connector | **Ordinary commercial users are not eligible.** Must never be a product prerequisite. | Entire scope if no research agreement exists. |
| **YouTube Data API v3** | Discover videos, collect public statistics (views, likes, comments over time) | API key (quota-gated). Public metrics are useful performance signals, **not** creators' private analytics. | Watch-time, retention, traffic sources, revenue. |
| **YouTube Analytics API** | Deeper metrics for a **connected, authorized** channel | OAuth by the channel owner (or properly authorized account). | Only usable for the user's own channels — labeled "own-account" data, distinct from competitor observation. |
| Additional social platforms / ad libraries | Competitor discovery, organic analysis, authorized publishing | Add **only after** verifying current access conditions, permitted use, fields, rate limits, geographic coverage — recorded here first. | By definition, unknown until vetted. |

**Rule (F8)**: each source/connector declares capability **per permission domain** — `research`, `analytics` (own-account), `publishing` (organic), `scheduling`, `paid_ads` (future, separate approval + budget caps + audit trail). Possession of one capability never implies another.

## 3. The four acquisition methods (architecture supports all four)

1. **Official APIs & approved integrations** — the primary route for repeatable research and authorized account operations.
2. **Public transparency tools** — where no API dataset exists, help users *locate and manually review* evidence through platform-permitted access. The harness records the human-collected evidence with its provenance; it does not automate extraction beyond what the platform permits.
3. **User-authorized account connections & imports** — OAuth'd own-account analytics/advertising, plus supported report uploads/exports for historical baselines.
4. **Historical archives & licensed sources** — only where provenance, coverage and usage rights are clear; stored with access-method tags.

## 4. Honesty rules encoded in the coverage model

- Every research result carries a **coverage ledger** (states: `available` / `limited` / `unavailable` / `not_connected`) plus **evidence provenance** (`verified` / `estimated` / `reported` / `simulated`).
- Conclusions are drawn **only** at the strength the evidence supports. Examples that must remain encoded, not model-remembered: long-running ads are a research signal, not proof of profitability; a million views ≠ a million qualified views; engagement is not conversion.
- The system must distinguish **verified data, estimated signals, unavailable data, and inaccessible sources** rather than silently filling gaps (schema: `packages/marketing/src/coverage`).
- Metric semantics are versioned: platform metric definitions change, so observations retain metric definitions and connector versions (`MARKETING-DATA-MODEL.md` §4).

## 5. Connector conformance obligations

Every connector implementation must, before merge:

1. Re-verify this file's row for its source (date-stamped evidence, at minimum an authenticated smoke test).
2. Declare capability domains, quota behavior, retry policy, idempotency keys, and error taxonomy per `PLATFORM-CONNECTOR-CONTRACT.md`.
3. Emit per-run `CoverageReport` entries; never let a partial result render as complete coverage.
4. Respect authentication, CAPTCHA, rate limits and platform restrictions; egress goes through adapters with the existing WebFetch-style egress guard discipline (North-Star N2).
