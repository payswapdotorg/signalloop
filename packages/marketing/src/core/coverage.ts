/**
 * 覆盖率台账（MARKETING-DATA-MODEL.md §5，MARKETING-DATA-SOURCES.md §4）。
 *
 * 每次研究运行都以覆盖率台账收尾；结论强度由代码规则推导，
 * 不允许模型自由发挥"数据很全"这类话术。
 */
import { z } from "zod";
import { isoDateTime } from "./identifiers.js";
import { evidenceProvenanceSchema, type EvidenceProvenance } from "./evidence.js";

/** 覆盖状态：available / limited / unavailable / not_connected。 */
export const coverageStateSchema = z.enum(["available", "limited", "unavailable", "not_connected"]);
export type CoverageState = z.infer<typeof coverageStateSchema>;

/** 覆盖维度：与连接器能力域解耦的研究面。 */
export const coverageDimensionSchema = z.enum([
  "organic_discovery",
  "ad_library",
  "conversion_performance",
  "own_account_analytics",
  "publishing",
  "measurement",
]);
export type CoverageDimension = z.infer<typeof coverageDimensionSchema>;

export const coverageEntrySchema = z.object({
  missionId: z.string().min(1),
  sourceId: z.string().min(1),
  dimension: coverageDimensionSchema,
  state: coverageStateSchema,
  /** 状态的技术原因（如"EU 商业广告 API 未覆盖美国投放"），必填。 */
  detail: z.string().min(1),
  evidenceProvenance: evidenceProvenanceSchema.nullable(),
  asOf: isoDateTime,
});
export type CoverageEntry = z.infer<typeof coverageEntrySchema>;

/** 结论强度三档：够排序 > 够提出假设 > 不够。 */
export const conclusionStrengthSchema = z.enum([
  "sufficient_for_ranking",
  "sufficient_for_hypothesis",
  "insufficient",
]);
export type ConclusionStrength = z.infer<typeof conclusionStrengthSchema>;

export const coverageLedgerSchema = z.object({
  missionId: z.string().min(1),
  entries: z.array(coverageEntrySchema),
  conclusionStrength: conclusionStrengthSchema,
  /** 逐字渲染给用户的结论（由 buildCoverageLedger 生成，确定性文案）。 */
  conclusion: z.string().min(1),
  asOf: isoDateTime,
});
export type CoverageLedger = z.infer<typeof coverageLedgerSchema>;

const RESEARCH_DIMENSIONS = new Set<CoverageDimension>(["organic_discovery", "ad_library"]);

/**
 * 台账组装规则（确定性）：
 * 1. 研究维度（organic_discovery / ad_library）全部 available → sufficient_for_ranking；
 * 2. 至少一个研究维度 available 或 limited → sufficient_for_hypothesis；
 * 3. 否则 insufficient。
 * 转化/自有账号维度不参与升级，只参与结论文案（它们几乎永远 not_connected）。
 */
export function buildCoverageLedger(input: {
  missionId: string;
  entries: CoverageEntry[];
  asOf: string;
}): CoverageLedger {
  const researchEntries = input.entries.filter((entry) => RESEARCH_DIMENSIONS.has(entry.dimension));
  const allResearchAvailable =
    researchEntries.length > 0 && researchEntries.every((entry) => entry.state === "available");
  const anyResearchUsable = researchEntries.some(
    (entry) => entry.state === "available" || entry.state === "limited",
  );
  const notConnected = input.entries
    .filter((entry) => entry.state === "not_connected")
    .map((entry) => entry.dimension);
  const worstProvenance = worstEvidenceProvenance(input.entries);

  const conclusionStrength = allResearchAvailable
    ? "sufficient_for_ranking"
    : anyResearchUsable
      ? "sufficient_for_hypothesis"
      : "insufficient";

  const conclusion =
    conclusionStrength === "sufficient_for_ranking"
      ? `结论：研究维度证据可用，足以支撑竞争格局排序与创意假设${suffixFor(notConnected, worstProvenance)}`
      : conclusionStrength === "sufficient_for_hypothesis"
        ? `结论：可用证据足以形成初步创意假设，但不足以对竞争对手的销售或广告回报做出确定性排序${suffixFor(notConnected, worstProvenance)}`
        : `结论：当前没有任何可用的研究维度证据，不生成任何策略结论${suffixFor(notConnected, worstProvenance)}`;

  return {
    missionId: input.missionId,
    entries: input.entries,
    conclusionStrength,
    conclusion,
    asOf: input.asOf,
  };
}

function worstEvidenceProvenance(entries: CoverageEntry[]): EvidenceProvenance | null {
  const order: EvidenceProvenance[] = ["simulated", "reported", "estimated", "verified"];
  let worst: EvidenceProvenance | null = null;
  for (const entry of entries) {
    if (!entry.evidenceProvenance) continue;
    if (worst === null || order.indexOf(entry.evidenceProvenance) < order.indexOf(worst)) {
      worst = entry.evidenceProvenance;
    }
  }
  return worst;
}

function suffixFor(
  notConnected: CoverageDimension[],
  provenance: EvidenceProvenance | null,
): string {
  const parts: string[] = [];
  if (notConnected.length > 0) {
    parts.push(`未连接：${notConnected.join("、")}`);
  }
  if (provenance === "simulated") {
    parts.push("注意：当前证据含演示/模拟数据，不代表真实市场表现");
  }
  return parts.length > 0 ? `（${parts.join("；")}）` : "";
}
