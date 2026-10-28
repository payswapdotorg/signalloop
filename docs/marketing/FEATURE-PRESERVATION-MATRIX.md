# FEATURE-PRESERVATION-MATRIX

Status: `frozen` at W0 audit · Owner: TL · Baseline commit: `3c5b227649371507ddc4eb46ac5133afe6db1cab`

This matrix inventories the upstream capabilities that **must continue to work** in this fork, their verification mechanisms, and what marketing work may and may not touch. Re-audit after every upstream merge.

## 1. Preservation inventory

| # | Upstream capability | Key locations (W0-audited) | Must remain intact | Marketing work may… |
|---|---|---|---|---|
| P1 | Agent runtime (loop, turn machine, command admission) | `apps/zcode-cli/packages/core/src/runtime/agent-runtime.ts`, `agent/turn-machine.ts`, `runtime/command-queue.ts` | ✅ unchanged behavior | read only — invoke, never modify |
| P2 | Tool system (registry, executor, permissions, budgets) | `core/src/tool/{registry.ts, executor.ts, types.ts, handlers/index.ts}`; contracts `apps/zcode-cli/packages/contracts/src/tools/*` | ✅ registration + gating semantics | add tools via plugin/MCP path; core additions only per tool-change-chain spec |
| P3 | Provider & model registry (selection, capabilities, overlays) | `packages/provider/src/*`, `packages/provider-node/src/*`, `packages/model-option-map`, `packages/shared/src/model-config.ts` | ✅ | read capability metadata; never fork selection logic |
| P4 | Sessions & persistence (2 SQLite DBs, migration runner, additive contract) | `apps/zcode-cli/packages/adapters/src/storage/session-store/*`; `packages/services/src/session/*`; `packages/shared/src/sqlite-migrations/*`; `scripts/check-sqlite-schema.ts` | ✅ schemas additive-only | add a *new* marketing DB + baselines; never rewrite existing baselines |
| P5 | ZCode Protocol (stdio/WebSocket, strict zod) | `packages/shared/src/zcode-protocol/index.ts`, `zcode-protocol-v4/` | ✅ wire compatibility | extend via documented protocol additions with runtime validation |
| P6 | RPC framework & server | `packages/rpc/src/*`, `packages/server/src/http.ts` | ✅ | add routes per bots/server pattern, no direct runtime coupling |
| P7 | Clients (desktop/web/android) + web-remote semantics | `packages/desktop/*`, `packages/web/*`, `packages/android/*`, `web-share`, `share-ui` | ✅ `desktop-continuous` vs `web-remote-replayable` semantics | surface marketing UX via existing UI modules/Gen-UI/plugin UI |
| P8 | Bots channel runtimes (Feishu/Telegram/Weixin/webhook) | `packages/services/src/bots/*` | ✅ | extend pattern for platform callbacks; no new inbound framework |
| P9 | Automations (cron), off-peak tasks, background subagents/bash | `contracts/src/interfaces/automation.port.ts`; `packages/services/src/session/automation{Service,Repo}.ts`, `offPeakTaskRepo.ts`; `core/src/subagent/*` | ✅ incl. `AUTOMATION_CREATE_LIMIT` | use for scheduled research/measurement; no second scheduler |
| P10 | Plugins & marketplace (incl. Claude-marketplace compat), MCP | `apps/zcode-cli/packages/adapters/src/plugins/`; `bootstrap/src/app/plugin-facade.ts`, `official-plugin-definitions.ts`; `docs/claude-code-marketplace-plugin-compat.md` | ✅ | add marketing plugin; never alter compat behavior |
| P11 | Skills & bundled skills | `.agents/skills/`, `apps/zcode-cli/packages/bundled-skills`, plugin skills | ✅ | add marketing skills |
| P12 | Permission system (modes, rules, broker, egress guard) | `core/src/permission/service.ts`, `contracts/src/interfaces/permission.port.ts`, `core/src/tool/handlers/webfetch-egress-guard.ts` | ✅ incl. `build` default mode & broker flows | register publishing actions as `alwaysAsk` + `no-always-allow` |
| P13 | Dynamic workflows (DWF) | `apps/zcode-cli/packages/dynamic-workflow*`, `bootstrap/src/app/dynamic-workflow-run-*.ts` | ✅ | may model marketing missions as workflows (runtime-owned mechanism) |
| P14 | Telemetry/metrics | `apps/zcode-cli/packages/telemetry/*`, `core/src/telemetry/runtime-telemetry.ts` | ✅ | record routing/coverage events through it |
| P15 | Build/test/architecture governance | `verify:pre-push`, `test:architecture`, `architecture-policy.yaml` + `scripts/architecture/*`, `knip.json`, `dep:graph`, oxlint/oxfmt, 800-line cap | ✅ all gates keep passing | register new modules via `architecture:adopt`; keep zero lint-disables |
| P16 | Notices & licensing | `LICENSE` (Apache-2.0), `NOTICE.md`, `THIRD-PARTY-NOTICES.md`, `third-party/`, `patches/` | ✅ preserved verbatim | new deps ⇒ notice regeneration + third-party terms review |
| P17 | zcode-cua placeholder honesty | `packages/zcode-cua/index.js` ("not available in this build"), `NOTICE.md` disclosures | ✅ | never build on assumed CUA availability; Browser Use vs Computer Use assessed separately |
| P18 | Marketing-touch (first-party promo, distinct from this product) | `packages/shared/src/marketingTouch.ts`, `packages/services/src/marketing-touch/` | ✅ | do not conflate naming; our modules are `marketing-intelligence`/`packages/marketing` |

## 2. Regression coverage mapping

| Preserved area | Existing suites that cover it | Marketing must not break |
|---|---|---|
| CLI runtime/tools/sessions | `pnpm --dir apps/zcode-cli typecheck && test` (turbo/vitest suites) | CLI test list |
| Desktop E2E | `pnpm test:e2e*`, container suites (`test:e2e:container:*`) | e2e case catalog |
| Architecture rules | `pnpm test:architecture` + `pnpm architecture:check -- --changed` | registered modules |
| DB contracts | `pnpm db:schema:check` (additive-only both baselines) | both `schema.baseline.sql` files |
| Root unit tests | `pnpm test:unit` (vitest), affected via pre-push | affected scope |
| Lint/format/type | `pnpm lint`, `fmt:check`, `typecheck` (root list incl. all packages) | typecheck list updated when adding packages |
| Bash tool policy | `pnpm registry:check` (generated command registry) | registry generation |
| Plugin marketplace compat | plugin compat diagnostics tests | compat docs behavior |

## 3. Baseline capture status (W0)

- Fork mechanics verified: all branches + tags pushed; HEAD parity with upstream `main` (`3c5b227`).
- Audit complete (paths spot-verified); governance docs written (`docs/marketing/`).
- Scoped gates at W1 (this fork, this session): `packages/marketing` typecheck/composite-build ✅, vitest 8/8 ✅, oxlint 0/0 ✅, oxfmt ✅, `architecture:check --changed` ✅, `test:architecture` 36/36 ✅, `db:schema:check` 8/8 ✅.
- **Observed pre-existing upstream condition**: full-scope `architecture:check` (not `--changed`) reports 1 violation at `3c5b227` — `gen-ui-service` missing `contract.test.ts` (`packages/services/src/gen-ui`). This is upstream's own state, preserved untouched in the fork (preservation rule); flagged for upstream reconciliation, not silently fixed here.
- **Pending (environment-blocked)**: full monorepo root `tsc -b` typecheck and `pnpm knip` crash on sandbox memory limits (SIGABRT / oxc-parser OOM) — environment constraints, not code findings; must be captured in CI or a dev workstation (tracked as `WO-004`).
- Adding packages later must append to the root `typecheck` `tsc -b` list (non-automatic — see `package.json`).

## 4. Known upstream limitations to respect

- No default OS sandbox for agent execution (NOTICE.md) — publishing/credential paths rely on permission gates, not sandboxing.
- `--prompt` without `--mode` uses `yolo` — marketing tools must not rely on interactive approval in that mode; publishing must be fail-closed (deny broker default).
- Computer Use is a placeholder in this distribution — capabilities must not assume it.
- Root affected-unit tests do **not** cover `apps/zcode-cli` packages — CLI suite must run separately.
