/**
 * 规范记录（11 条 canonical + 1 条运营记录，MARKETING-DATA-MODEL.md §1）。
 *
 * 规则：
 * - 所有记录 mission 作用域内携带 sourceRecordId（来源系统身份）与本地 id。
 * - 字段冻结后 additive-only：改语义 = 新增可选字段 + 数据模型文档记录。
 * - 得分永远四分离（observed / crossSource / predicted / confidence），
 *   不得合并成一个数字（MARKETING-EVALUATION.md §3）。
 */
import { z } from "zod";
import {
  confidenceSchema,
  goalTypeSchema,
  isoDateTime,
  missionIdSchema,
  platformSchema,
  observedTargetTypeSchema,
  sourceIdSchema,
} from "./identifiers.js";
import { evidenceProvenanceSchema } from "./evidence.js";
import { metricDefinitionRefSchema } from "./temporal.js";

const idFields = {
  id: z.string().min(1),
  missionId: missionIdSchema,
  createdAt: isoDateTime,
} as const;

const evidenceRefs = z.array(z.string()).default([]);

/** 1. ProductBrief：任务的事实底座。 */
export const productBriefSchema = z.object({
  ...idFields,
  product: z.string().min(1),
  category: z.string().min(1),
  audience: z.string().min(1),
  country: z.string().min(2),
  platforms: z.array(platformSchema).min(1),
  offer: z.string().min(1),
  objective: goalTypeSchema,
  desiredOutcome: z.string().min(1),
  constraints: z.array(z.string()).default([]),
  positioning: z.string().nullable(),
  /** 用户原话输入，保留以供审计。 */
  rawInput: z.string().min(1),
});
export type ProductBrief = z.infer<typeof productBriefSchema>;

/** 2. CompetitorEntity：身份置信度 + 相关性理由 + 用户可纠正状态。 */
export const competitorStatusSchema = z.enum(["candidate", "confirmed", "rejected", "corrected"]);
export const competitorEntitySchema = z.object({
  ...idFields,
  name: z.string().min(1),
  handles: z.array(z.string()).default([]),
  platform: platformSchema,
  identityConfidence: confidenceSchema,
  /** 为什么相关：关键词重叠 ≠ 自动直接竞对（North-Star G1）。 */
  relevanceReason: z.string().min(1),
  status: competitorStatusSchema,
  sourceId: sourceIdSchema.nullable(),
  evidenceRefs,
});
export type CompetitorEntity = z.infer<typeof competitorEntitySchema>;

/** 3. AdCreative：可观察广告内容与投放史。 */
export const adCreativeSchema = z.object({
  ...idFields,
  sourceId: sourceIdSchema,
  sourceRecordId: z.string().min(1),
  platform: platformSchema,
  advertiserName: z.string().min(1),
  format: z.string().min(1),
  hook: z.string().nullable(),
  message: z.string().nullable(),
  offer: z.string().nullable(),
  cta: z.string().nullable(),
  durationSec: z.number().int().positive().nullable(),
  aspectRatio: z.string().nullable(),
  firstObservedAt: isoDateTime,
  lastObservedAt: isoDateTime,
  variationCount: z.number().int().min(1).default(1),
  landingMatch: z.string().nullable(),
  evidenceRefs,
});
export type AdCreative = z.infer<typeof adCreativeSchema>;

/** 4. OrganicContent：公开内容与作者元数据。 */
export const organicContentSchema = z.object({
  ...idFields,
  sourceId: sourceIdSchema,
  sourceRecordId: z.string().min(1),
  platform: platformSchema,
  authorHandle: z.string().min(1),
  authorFollowers: z.number().int().nullable(),
  format: z.string().min(1),
  caption: z.string().nullable(),
  publishedAt: isoDateTime,
  evidenceRefs,
});
export type OrganicContent = z.infer<typeof organicContentSchema>;

/** 5. MetricObservation：不可变指标观察（W2 幂等键的基础）。 */
export const metricObservationSchema = z.object({
  ...idFields,
  targetType: observedTargetTypeSchema,
  targetId: z.string().min(1),
  metric: metricDefinitionRefSchema,
  value: z.number(),
  observedAt: isoDateTime,
  ingestedAt: isoDateTime,
  sourceId: sourceIdSchema,
  region: z.string().nullable(),
  experimentId: z.string().nullable(),
  provenance: evidenceProvenanceSchema,
});
export type MetricObservation = z.infer<typeof metricObservationSchema>;

/** 6. CreativeFeatureSet：结构化创意特征（不是内容摘要）。 */
export const creativeFeatureSetSchema = z.object({
  ...idFields,
  targetType: observedTargetTypeSchema,
  targetId: z.string().min(1),
  hookPattern: z.string().nullable(),
  storyStructure: z.string().nullable(),
  visualProduction: z.string().nullable(),
  offerConversion: z.string().nullable(),
  /** 分析所用模型/工具（能力路由的留痕，G4）。 */
  analyzedBy: z.string().min(1),
  confidence: confidenceSchema,
  evidenceRefs,
});
export type CreativeFeatureSet = z.infer<typeof creativeFeatureSetSchema>;

/** 四分离得分（0..1，各自独立，绝不合成一个数）。 */
export const opportunityScoresSchema = z.object({
  observedPerformance: confidenceSchema,
  crossSourceSupport: confidenceSchema,
  predictedPerformance: confidenceSchema,
  confidence: confidenceSchema,
});
export type OpportunityScores = z.infer<typeof opportunityScoresSchema>;

/** 7. CreativeHypothesis：证据 + 预测 + 显式不确定性 + 反例。 */
export const hypothesisStatusSchema = z.enum([
  "proposed",
  "selected",
  "briefed",
  "testing",
  "validated",
  "rejected",
]);
export const creativeHypothesisSchema = z.object({
  ...idFields,
  rank: z.number().int().min(1).nullable(),
  angle: z.string().min(1),
  audienceProblem: z.string().min(1),
  message: z.string().min(1),
  hookPattern: z.string().min(1),
  formatStyle: z.string().min(1),
  demoStrategy: z.string().min(1),
  offerCta: z.string().min(1),
  scores: opportunityScoresSchema,
  explanation: z.string().min(1),
  missingData: z.array(z.string()).min(0),
  contraryExamples: z.array(z.string()).default([]),
  status: hypothesisStatusSchema,
  evidenceRefs,
});
export type CreativeHypothesis = z.infer<typeof creativeHypothesisSchema>;

/** 8. CreativeArtifact：brief + 提示词包 + 实验规格。 */
export const creativeArtifactSchema = z.object({
  ...idFields,
  hypothesisId: z.string().min(1),
  title: z.string().min(1),
  intent: z.string(),
  blueprint: z.string(),
  /** 生成器专属提示词包（Higgsfield 等，adapter 分离，见 CAPABILITY-MAP §2）。 */
  promptPack: z.string(),
  experimentSpec: z.string(),
  /** 用户上传/回传资产后的校验结果；未校验为 null。 */
  validation: z.string().nullable(),
  version: z.number().int().min(1).default(1),
});
export type CreativeArtifact = z.infer<typeof creativeArtifactSchema>;

/** 9. ExperimentRecord：假设 → 变体 → 测量窗口 → 结果。 */
export const experimentStatusSchema = z.enum([
  "planned",
  "awaiting_approval",
  "approved",
  "published",
  "measuring",
  "complete",
  "failed",
]);
export const experimentRecordSchema = z.object({
  ...idFields,
  hypothesisId: z.string().min(1),
  artifactId: z.string().min(1),
  status: experimentStatusSchema,
  successMetric: z.string().min(1),
  measurementWindowDays: z.number().int().min(1),
  forecastRef: z.string().nullable(),
  actualValue: z.number().nullable(),
  deviation: z.number().nullable(),
  learning: z.string().nullable(),
});
export type ExperimentRecord = z.infer<typeof experimentRecordSchema>;

/** 10. SimulationRun：预测与校准（与观察史分开存，counterfactual）。 */
export const simulationRunSchema = z.object({
  ...idFields,
  experimentId: z.string().min(1),
  predictedMin: z.number(),
  predictedMax: z.number(),
  assumptions: z.string().min(1),
  modelVersion: z.string().min(1),
  actual: z.number().nullable(),
  calibrationError: z.number().nullable(),
});
export type SimulationRun = z.infer<typeof simulationRunSchema>;

/** 11. PublicationRecord：发布审批与审计（MARKETING-DATA-MODEL.md §1 配套运营记录）。 */
export const publicationStatusSchema = z.enum([
  "pending_approval",
  "approved",
  "publishing",
  "published",
  "failed",
  "withdrawn",
]);
export const publicationRecordSchema = z.object({
  ...idFields,
  experimentId: z.string().min(1),
  /** 幂等键：mission~artifactVersion~destination（重试不得复建）。 */
  identityKey: z.string().min(1),
  platform: platformSchema,
  accountRef: z.string().min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  scheduledFor: isoDateTime.nullable(),
  /** 审批必须显式且可审计（G5）；never null-on-publish。 */
  approvedBy: z.string().nullable(),
  approvedAt: isoDateTime.nullable(),
  platformPostId: z.string().nullable(),
  postUrl: z.string().url().nullable(),
  status: publicationStatusSchema,
  /** 有机发布 ≠ 付费投放（F8）：paid 域必须有独立审批与预算上限。 */
  permissionDomain: z.enum(["publishing_organic"]),
});
export type PublicationRecord = z.infer<typeof publicationRecordSchema>;
