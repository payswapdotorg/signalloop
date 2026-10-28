/**
 * 时间语义（"时间机器"，MARKETING-DATA-MODEL.md §2）。
 *
 * 三种时间永不混淆：observedAt / publishedAt / ingestedAt。
 * 快照身份保证幂等：同一来源记录同一时间点的同一指标只存在一条观察。
 * 快照身份键一旦发布不得变更格式（旧键必须永远可解析）。
 */
import { z } from "zod";
import { isoDateTime } from "./identifiers.js";

/** 观察模式：live 监控 / replay 历史重放 / counterfactual 反事实模拟。 */
export const temporalModeSchema = z.enum(["live", "replay", "counterfactual"]);
export type TemporalMode = z.infer<typeof temporalModeSchema>;

export const temporalStampSchema = z.object({
  /** 该数值/事实实际被观察到的时间（尽量取源自时间）。 */
  observedAt: isoDateTime,
  /** 来源事件时间（帖子/广告发布时间）；缺失即 null，不得伪造。 */
  publishedAt: isoDateTime.nullable(),
  /** 本地流水线入库时间（本地时钟）。 */
  ingestedAt: isoDateTime,
});
export type TemporalStamp = z.infer<typeof temporalStampSchema>;

/** 平台指标定义会变化：观察必须保留定义版本（MARKETING-DATA-MODEL.md §4）。 */
export const metricDefinitionRefSchema = z.object({
  metricKey: z.string().min(1),
  definitionVersion: z.string().min(1),
  /** 指标口径说明或文档链接，缺失即 null。 */
  semanticsNote: z.string().nullable(),
});
export type MetricDefinitionRef = z.infer<typeof metricDefinitionRefSchema>;

/**
 * 快照身份（W2 幂等落库的键）：
 * (missionId, sourceId, sourceRecordId, observedAt, metricKey?)。
 * 无指标的事实记录（如广告创意入库）metricKey 用空串参与计算。
 */
export const snapshotIdentityInputSchema = z.object({
  missionId: z.string().min(1),
  sourceId: z.string().min(1),
  sourceRecordId: z.string().min(1),
  observedAt: isoDateTime,
  metricKey: z.string().default(""),
});
export type SnapshotIdentityInput = z.infer<typeof snapshotIdentityInputSchema>;

/** 稳定键：字段顺序固定、URL 安全；只依赖上述五个字段。 */
export function snapshotIdentity(input: SnapshotIdentityInput): string {
  const parts = [
    input.missionId,
    input.sourceId,
    input.sourceRecordId,
    input.observedAt,
    input.metricKey,
  ];
  return `snap_${parts.map((part) => encodeURIComponent(part)).join("~")}`;
}

/** as-of 查询：重放"当时我们实际观察到什么"（replay 模式，只读）。 */
export const asOfQuerySchema = z.object({
  missionId: z.string().min(1),
  asOf: isoDateTime,
  targetIds: z.array(z.string()).optional(),
  metricKeys: z.array(z.string()).optional(),
});
export type AsOfQuery = z.infer<typeof asOfQuerySchema>;

/**
 * 发布幂等键（MARKETING-DATA-MODEL.md §2.1）：
 * (missionId, artifactVersion, destination)。重试发布必须复用原键，
 * 平台端重复创建必须被 publication_duplicate_blocked 拦截。
 */
export const publicationIdentityInputSchema = z.object({
  missionId: z.string().min(1),
  artifactVersion: z.number().int().min(1),
  destination: z.string().min(1),
});
export type PublicationIdentityInput = z.infer<typeof publicationIdentityInputSchema>;

export function publicationIdentity(input: PublicationIdentityInput): string {
  return `pub_${input.missionId}~${input.artifactVersion}~${encodeURIComponent(input.destination)}`;
}
