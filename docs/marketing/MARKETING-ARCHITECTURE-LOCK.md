# MARKETING-ARCHITECTURE-LOCK

Status: `frozen` (W1) · Owner: TL · Applies to: every commit touching marketing functionality

This file locks the architectural decisions for the SignalLoop marketing domain. It is derived from the W0 upstream audit of this fork at `3c5b227649371507ddc4eb46ac5133afe6db1cab`. Violations block merge (`pnpm architecture:check -- --changed`, `pnpm verify:pre-push`).

## 1. The one decision that matters most

**The existing ZCode runtime is the execution engine.** The marketing domain layer adds capabilities through audited extension points only. Marketing logic must never become a fork of the agent loop, a second session engine, a second scheduler, or a second persistence stack.

Intended layering (logical):

```
Marketing product experience   (ZCode clients: TUI / web / desktop — unchanged UX surfaces)
Marketing domain capabilities  (six specialist capabilities — logical roles, not six persistent agents)
Marketing domain contracts     (packages/marketing — records, coverage, connector, capability, temporal)
Existing ZCode runtime         (AgentRuntime · ToolRegistry · provider registry · sessions · permissions · subagents)
Existing infrastructure        (SQLite patterns · RPC/server · browser/MCP/plugin seams · UI)
```

## 2. Extension seams (audited, exact paths)

| Marketing need | Existing seam to use | Exact paths (verified at W0) |
|---|---|---|
| Domain records, contracts, coverage model, connector contract | New managed package `packages/marketing` (pure domain contracts, zod-only) | registered in `architecture-policy.yaml`; artifacts per golden-module |
| Agent-visible research/publish tools | **MCP plugin package** (zero-core path) — tools surface as `mcp__plugin_<plugin>_<key>__<tool>` through the existing executor + permission machinery | manifest `.zcode-plugin/plugin.json`; model on `apps/zcode-cli/packages/image-search-plugin/`; official seed `apps/zcode-cli/packages/bootstrap/src/app/official-plugin-definitions.ts` |
| Built-in tool fallback (only if plugin path is proven insufficient) | zod contract in `contracts/src/tools/`, `ToolEntry` handler, `builtInTools` registration | `apps/zcode-cli/packages/contracts/src/tools/<tool>.ts`; `apps/zcode-cli/packages/core/src/tool/handlers/` + `handlers/index.ts`; **mandatory** `apps/zcode-cli/docs/design/v2/tool/00-tool-change-chain.md` first |
| Model/tool selection by capability | Existing provider registry + model capability metadata | `packages/shared/src/model-config.ts` (`completeModelPropertiesDataSchema`: `inputFormat.supportsImage/sVideo/sAudio`, `supportsToolCall`, `supportsJsonSchemaOutput`, `supportsNativeWebSearch`); `packages/provider/src/registry.ts`; auxiliary model options `apps/zcode-cli/packages/core/src/model/auxiliary-model-options.ts` |
| Sub-capability parallelism | Existing subagent/task mechanisms — never a new framework | `apps/zcode-cli/packages/core/src/subagent/` (`runner.ts`, `profile.ts`); `contracts/src/interfaces/subagent.port.ts` |
| Scheduled research / measurement pulls | Existing automation system (cron) — never a new scheduler | `contracts/src/interfaces/automation.port.ts`; `packages/services/src/session/automationService.ts`, `automationRepo.ts` (note `AUTOMATION_CREATE_LIMIT`; cron creation forbidden inside automation turns) |
| Persistence | Existing SQLite pattern: `node:sqlite` + shared migration runner + repo with `ensureReady()` + `schema.baseline.sql` + registration in the schema contract | pattern: `packages/services/src/session/automationRepo.ts`, `taskIndexRepo.ts`; runner `packages/shared/src/sqlite-migrations/`; contract `scripts/check-sqlite-schema.ts` (additive-only) |
| Publishing approval gate | Existing permission broker: `alwaysAsk` + `optionsPolicy: "no-always-allow"` | `apps/zcode-cli/packages/core/src/tool/types.ts` (`ToolPermissionSpec.alwaysAsk`); `contracts/src/interfaces/permission.port.ts` |
| Webhooks / platform callbacks | Existing bots channel-runtime pattern (or a route on `packages/server`), never direct runtime coupling | `packages/services/src/bots/channelRuntime.ts`, `providers/webhookProvider.ts` |
| Client-visible surfaces | Existing protocol: strict zod in `zcode-protocol`, UI via `packages/ui` managed modules | `packages/shared/src/zcode-protocol/index.ts` (+ `zcode-protocol-v4/`); contract module pattern e.g. `packages/ui/src/marketing-touch-contract/` |
| Creative-generation tools (Higgsfield etc.) | Adapter per tool inside the marketing plugin; adapters are separate from the intelligence workflow | plugin `userConfig` + MCP server in `apps/zcode-cli/packages/marketing-plugin/` |
| Skills (operator playbooks) | Existing skills system (SKILL.md, plugin skills) | `docs/usage/08-skills.md`; `.agents/skills/`, plugin `skills/` |

## 3. Forbidden parallel implementations (hard blocks)

- **F1** No second agent loop, turn machine, conversation engine, or "marketing planner" that re-implements runtime orchestration. The runtime receives a marketing mission and plans using existing mechanisms.
- **F2** No new persistence stack (no Prisma/Dexie/SQLite driver of our own). Use `node:sqlite` with the shared migration runner; register every new DB + baseline in `scripts/check-sqlite-schema.ts`.
- **F3** No new scheduler. Scheduled pulls go through `AutomationPort` / off-peak tasks.
- **F4** No new subagent framework. Specialist capabilities are invoked through `SubagentPort`/agent tools.
- **F5** No second RPC/protocol. Client surface changes go through `zcode-protocol` with strict types and runtime validation.
- **F6** No direct `fetch`/`http`/`fs`/`child_process`/`process.env` in domain/business code — all external I/O converges on adapters/ports (root + CLI AGENTS.md rule). Use `createServiceLogger` for logging; credentials never in logs/prompts/artifacts.
- **F7** No provider/model hard-coding. All model choices flow through the capability routing layer (`packages/marketing/src/capability` + existing registry), and every routing decision is recorded.
- **F8** No connector may assume capability from access: having research access never implies analytics; analytics never implies publishing; organic publishing never implies paid advertising. Each is a separately declared and separately authorized permission domain.

## 4. Governance obligations (apply to all marketing work)

1. **Spec first** (root AGENTS.md): update the relevant `docs/marketing/*` spec before changing behavior.
2. **Managed modules only**: every new source file under `packages/` or `apps/` must live in a `managed: true` module registered in `architecture-policy.yaml` (use `pnpm architecture:adopt <id> --root <dir>`), or the `unmanaged-new-file` rule fails the pre-push gate.
3. **Size/quality limits**: 800-line files, 300-line contracts, ≤12 public methods per contract, zero `lint-disable` comments, no cycles, no deep imports — enforced by `pnpm test:architecture` and `architecture:check`.
4. **Verification**: `pnpm typecheck && pnpm lint && pnpm fmt:check && pnpm db:schema:check && pnpm test:architecture && pnpm architecture:check -- --changed && pnpm test:unit:affected` (root packages); additionally `pnpm --dir apps/zcode-cli typecheck && lint && test` for anything under `apps/zcode-cli`. CLI-side DB structure changes must be synced with the CLI owner per `apps/zcode-cli/AGENTS.md`.
5. **Documentation is bilingual**: zh canonical + `.en.md` variant is the upstream convention; new marketing docs are English-canonical at W1, zh translations owed before W7 (tracked in `WORK-REGISTRY.md`, WO-DOC-002).
6. **Third-party terms**: every new connector integration requires a `MARKETING-DATA-SOURCES.md` entry (permissions, regions, fields, retention, quotas) before its first code commit.

## 5. Migration & evolution rules

- Additive schema evolution only (`assertAdditiveSchema`); baselines refresh via `pnpm db:schema:update` after review, never hand-edited.
- `dependency-graph.mmd` regenerates via `pnpm dep:graph`; new package cross-imports must be declared in module `requires` and public entry points honored (`knip`, `dep:refs`).
- New npm dependencies: check `third-party/` notice regeneration and patch policy (`patches/`).
- Anything that must touch a legacy/unmanaged file gets an explicit `exceptions[]` entry in `architecture-policy.yaml` with `id/rule/paths/reason` and an expiry where sensible.
- Upstream re-syncs happen on the TL's fork baseline; re-run the W0 audit deltas and update `FEATURE-PRESERVATION-MATRIX.md` after every upstream merge.
