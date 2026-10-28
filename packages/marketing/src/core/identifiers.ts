/**
 * @zcode/marketing 域标识与基础枚举。
 *
 * 来源：docs/marketing/MARKETING-DATA-MODEL.md（W1 冻结）。
 * 约定：所有 id 在持久层是普通字符串；TS 侧用品牌类型防止跨域误用。
 * 枚举值一旦冻结只增不改（additive-only）。
 */
import { z } from "zod";

/** ISO-8601 日期时间（UTC，含毫秒），全部时间字段的统一格式。 */
export const isoDateTime = z.iso.datetime();
export type IsoDateTime = string;

/** 预定义错误码之外不再放宽：这是对外文档化承诺的一部分。 */
export const recordKindSchema = z.enum([
  "product_brief",
  "competitor_entity",
  "ad_creative",
  "organic_content",
  "metric_observation",
  "creative_feature_set",
  "evidence_record",
  "creative_hypothesis",
  "creative_artifact",
  "experiment_record",
  "simulation_run",
  "publication_record",
]);
export type RecordKind = z.infer<typeof recordKindSchema>;

export type MissionId = string & { readonly __brand: "MissionId" };
export type RecordId = string & { readonly __brand: "RecordId" };
export type SourceId = string & { readonly __brand: "SourceId" };
export type SourceRecordId = string & { readonly __brand: "SourceRecordId" };

export const missionIdSchema = z
  .string()
  .regex(/^mission_[a-z0-9][a-z0-9_]*$/, "mission id 必须以 mission_ 开头");
export const sourceIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, "source id 使用小写字母与连字符");

/** 营销目标决定"衡量什么"（North-Star G6；评估见 MARKETING-EVALUATION.md §3）。 */
export const goalTypeSchema = z.enum([
  "awareness",
  "engagement",
  "traffic",
  "leads",
  "sales",
  "retention",
]);
export type GoalType = z.infer<typeof goalTypeSchema>;

export const platformSchema = z.enum(["meta", "tiktok", "youtube", "instagram", "other"]);
export type Platform = z.infer<typeof platformSchema>;

/**
 * 四类数据获取方式（MARKETING-DATA-SOURCES.md §3）。
 * 连接器与证据记录都必须声明使用了哪一类，作为覆盖率台账的输入。
 */
export const acquisitionMethodSchema = z.enum([
  "official_api",
  "public_transparency_tool",
  "authorized_account_or_import",
  "licensed_archive",
]);
export type AcquisitionMethod = z.infer<typeof acquisitionMethodSchema>;

/** 证据来源类型：用于 lineage 审计，而不是展示文案。 */
export const sourceTypeSchema = z.enum([
  "ad_library",
  "organic_feed",
  "own_account_analytics",
  "licensed_dataset",
  "user_report",
  "user_upload",
  "model_generated",
]);
export type SourceType = z.infer<typeof sourceTypeSchema>;

/** 置信度统一 0..1；生成方不得用"高/中/低"替代数值。 */
export const confidenceSchema = z.number().min(0).max(1);
export type Confidence = number;

/** 目标对象类型：观察与特征集都指向这三类之一。 */
export const observedTargetTypeSchema = z.enum([
  "ad_creative",
  "organic_content",
  "experiment_post",
]);
export type ObservedTargetType = z.infer<typeof observedTargetTypeSchema>;
