/**
 * 连接器类型化错误（PLATFORM-CONNECTOR-CONTRACT.md §3）。
 *
 * 错误是数据：必须持久化进覆盖率台账，驱动确定性覆盖状态迁移，
 * 严禁字符串化失败与吞错误。
 */
import { z } from "zod";
import { isoDateTime } from "../core/identifiers.js";

export const connectorErrorCodeSchema = z.enum([
  "auth_required",
  "scope_missing",
  "quota_exceeded",
  "rate_limited",
  "region_unsupported",
  "dataset_unavailable",
  "partial_results",
  "upstream_changed",
  "publication_duplicate_blocked",
]);
export type ConnectorErrorCode = z.infer<typeof connectorErrorCodeSchema>;

/** 各错误码要求的补充字段（discriminated union，缺字段即校验失败）。 */
export const connectorErrorSchema = z.discriminatedUnion("code", [
  z.object({
    code: z.literal("auth_required"),
    /** 缺失的授权域（research/analytics/...），渲染 not_connected 覆盖。 */
    capabilityDomain: z.string().min(1),
    message: z.string().optional(),
    occurredAt: isoDateTime,
  }),
  z.object({
    code: z.literal("scope_missing"),
    requiredScope: z.string().min(1),
    message: z.string().optional(),
    occurredAt: isoDateTime,
  }),
  z.object({
    code: z.literal("quota_exceeded"),
    /** 平台配额重置时间；未知为 null（此时必须按保守退避）。 */
    resetAt: isoDateTime.nullable(),
    message: z.string().optional(),
    occurredAt: isoDateTime,
  }),
  z.object({
    code: z.literal("rate_limited"),
    retryAfterMs: z.number().int().min(0),
    message: z.string().optional(),
    occurredAt: isoDateTime,
  }),
  z.object({
    code: z.literal("region_unsupported"),
    region: z.string().min(1),
    supportedRegions: z.array(z.string()).min(1),
    message: z.string().optional(),
    occurredAt: isoDateTime,
  }),
  z.object({
    code: z.literal("dataset_unavailable"),
    dataset: z.string().min(1),
    message: z.string().optional(),
    occurredAt: isoDateTime,
  }),
  z.object({
    code: z.literal("partial_results"),
    failedPages: z.number().int().min(1),
    message: z.string().optional(),
    occurredAt: isoDateTime,
  }),
  z.object({
    code: z.literal("upstream_changed"),
    detail: z.string().min(1),
    message: z.string().optional(),
    occurredAt: isoDateTime,
  }),
  z.object({
    code: z.literal("publication_duplicate_blocked"),
    existingIdentityKey: z.string().min(1),
    message: z.string().optional(),
    occurredAt: isoDateTime,
  }),
]);
export type ConnectorError = z.infer<typeof connectorErrorSchema>;

/** 各错误码映射到的覆盖状态（确定性迁移，台账渲染必须遵守）。 */
export const COVERAGE_TRANSITIONS: Readonly<Record<ConnectorErrorCode, string>> = Object.freeze({
  auth_required: "not_connected",
  scope_missing: "not_connected",
  quota_exceeded: "limited",
  rate_limited: "limited",
  region_unsupported: "limited",
  dataset_unavailable: "unavailable",
  partial_results: "limited",
  upstream_changed: "unavailable",
  publication_duplicate_blocked: "available",
});

/** 覆盖状态迁移规则（W2 组装台账时的唯一事实来源）。 */
export function coverageStateForError(code: ConnectorErrorCode): string {
  return COVERAGE_TRANSITIONS[code];
}
