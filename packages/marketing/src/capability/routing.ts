/**
 * 能力路由契约（MARKETING-CAPABILITY-MAP.md §3，North-Star G4）。
 *
 * 选择 = 满足任务能力要求的最低成本档；回退链显式；每次决策留痕。
 * 该层只做"选择策略"，模型注册与执行仍归既有 provider 体系（架构锁定 §2 F7）。
 */
import { z } from "zod";
import { isoDateTime } from "../core/identifiers.js";

export const taskKindSchema = z.enum([
  "text_classification",
  "structured_extraction",
  "web_research",
  "creative_analysis_vision",
  "creative_analysis_audio_video",
  "creative_generation",
  "strategy_synthesis",
  "evidence_retrieval",
]);
export type TaskKind = z.infer<typeof taskKindSchema>;

export const capabilityRequirementSchema = z.object({
  taskKind: taskKindSchema,
  needsJsonOutput: z.boolean().default(false),
  needsToolUse: z.boolean().default(false),
  minContextTokens: z.number().int().min(0).default(0),
  /** 成本上限档（1 最便宜）；超出即不选。 */
  maxCostTier: z.number().int().min(1).max(5).default(5),
});
export type CapabilityRequirement = z.infer<typeof capabilityRequirementSchema>;

/** 模型能力画像：与 packages/shared/src/model-config.ts 的属性对齐。 */
export const modelCapabilityProfileSchema = z.object({
  modelId: z.string().min(1),
  providerId: z.string().min(1),
  taskKinds: z.array(taskKindSchema).min(1),
  supportsToolCall: z.boolean().default(false),
  supportsJsonSchemaOutput: z.boolean().default(false),
  contextWindowTokens: z.number().int().min(0),
  costTier: z.number().int().min(1).max(5),
  latencyTier: z.number().int().min(1).max(5),
  reliability: z.number().min(0).max(1).default(1),
});
export type ModelCapabilityProfile = z.infer<typeof modelCapabilityProfileSchema>;

export const capabilitySelectionRequestSchema = z.object({
  requirements: capabilityRequirementSchema,
  eligibleModels: z.array(modelCapabilityProfileSchema).min(1),
  /** 允许调用方表达"优先最低成本/优先最高可靠"的既定偏好。 */
  preference: z.enum(["cheapest", "most_reliable"]).default("cheapest"),
});
export type CapabilitySelectionRequest = z.infer<typeof capabilitySelectionRequestSchema>;

export const capabilitySelectionSchema = z.object({
  selectedModelId: z.string().min(1),
  fallbackModelIds: z.array(z.string()),
  rationale: z.string().min(1),
  recordedAt: isoDateTime,
});
export type CapabilitySelection = z.infer<typeof capabilitySelectionSchema>;

/**
 * 确定性选择策略：
 * 1. 过滤：任务能力匹配；needsJsonOutput → supportsJsonSchemaOutput；
 *    needsToolUse → supportsToolCall；contextWindow ≥ minContextTokens；costTier ≤ maxCostTier。
 * 2. 排序：most_reliable 时先按 reliability 降序再按成本档升序；否则成本档升序再 latency 升序。
 * 3. 第一名选中，其余构成回退链；空集即抛错（调用方不得静默换模型，F7）。
 */
export function resolveCapability(
  request: CapabilitySelectionRequest,
  now: string,
): CapabilitySelection {
  const requirement = request.requirements;
  const eligible = request.eligibleModels.filter((model) => {
    if (!model.taskKinds.includes(requirement.taskKind)) return false;
    if (requirement.needsJsonOutput && !model.supportsJsonSchemaOutput) return false;
    if (requirement.needsToolUse && !model.supportsToolCall) return false;
    if (model.contextWindowTokens < requirement.minContextTokens) return false;
    if (model.costTier > requirement.maxCostTier) return false;
    return true;
  });
  if (eligible.length === 0) {
    throw new Error(
      `no eligible model for taskKind=${requirement.taskKind}: candidates were ${request.eligibleModels.map((model) => model.modelId).join(", ")}`,
    );
  }
  const sorted = [...eligible].sort((left, right) => {
    if (request.preference === "most_reliable" && left.reliability !== right.reliability) {
      return right.reliability - left.reliability;
    }
    if (left.costTier !== right.costTier) return left.costTier - right.costTier;
    if (left.latencyTier !== right.latencyTier) return left.latencyTier - right.latencyTier;
    return right.reliability - left.reliability;
  });
  const selected = sorted[0];
  if (!selected) {
    throw new Error("internal invariant: non-empty eligible list must have a head");
  }
  const fallbacks = sorted.slice(1);
  const rationale =
    `taskKind=${requirement.taskKind}; selected ${selected.modelId} (cost tier ${selected.costTier}, latency tier ${selected.latencyTier}); ` +
    `${fallbacks.length} fallback${fallbacks.length === 1 ? "" : "s"} declared`;
  return {
    selectedModelId: selected.modelId,
    fallbackModelIds: fallbacks.map((model) => model.modelId),
    rationale,
    recordedAt: now,
  };
}
