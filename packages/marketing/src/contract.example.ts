/**
 * marketing 标准调用示例：agent 靠模仿写代码，这里放的就是该模仿的那份。
 * 场景：一次研究运行结束时，用契约组装覆盖率台账、校验记录、
 * 记录能力路由决策——W2/W3 工具层将按此形状接线。
 */
import type { MarketingIntelligenceContract } from "./contract.js";
import type { CoverageEntry } from "./core/coverage.js";

export function exampleResearchRunCloseout(port: MarketingIntelligenceContract): {
  conclusion: string;
  snapshotKey: string;
  routingNote: string;
} {
  const asOf = "2026-10-28T10:42:54.000Z";

  // 1. 覆盖率台账：结构化状态 + 代码推导的结论强度（模型不得改写结论）。
  const entries: CoverageEntry[] = [
    {
      missionId: "mission_demo",
      sourceId: "youtube-data-api",
      dimension: "organic_discovery",
      state: "available",
      detail: "公开统计可读（API key 门控）",
      evidenceProvenance: "verified",
      asOf,
    },
    {
      missionId: "mission_demo",
      sourceId: "meta-ad-library",
      dimension: "ad_library",
      state: "limited",
      detail: "官方 API 仅覆盖 EU/UK 投放；本次目标市场为 US",
      evidenceProvenance: "verified",
      asOf,
    },
    {
      missionId: "mission_demo",
      sourceId: "meta-ads-manager",
      dimension: "conversion_performance",
      state: "not_connected",
      detail: "需要广告主账号授权（analytics 域）",
      evidenceProvenance: null,
      asOf,
    },
  ];
  const ledger = port.buildCoverageLedger({ missionId: "mission_demo", entries, asOf });

  // 2. 幂等：同一条来源观察永远得到同一个快照身份键。
  const snapshotKey = port.snapshotIdentity({
    missionId: "mission_demo",
    sourceId: "youtube-data-api",
    sourceRecordId: "yt_vid_001",
    observedAt: asOf,
    metricKey: "views",
  });

  // 3. 能力路由：声明式要求 + 合格画像 → 最低成本合格者胜出，回退链显式。
  const selection = port.resolveCapability(
    {
      requirements: {
        taskKind: "strategy_synthesis",
        needsJsonOutput: true,
        needsToolUse: false,
        minContextTokens: 0,
        maxCostTier: 5,
      },
      eligibleModels: [
        {
          modelId: "reasoner-pro",
          providerId: "p1",
          taskKinds: ["strategy_synthesis"],
          supportsToolCall: true,
          supportsJsonSchemaOutput: true,
          contextWindowTokens: 128000,
          costTier: 4,
          latencyTier: 4,
          reliability: 0.99,
        },
        {
          modelId: "reasoner-air",
          providerId: "p1",
          taskKinds: ["strategy_synthesis"],
          supportsToolCall: false,
          supportsJsonSchemaOutput: true,
          contextWindowTokens: 32000,
          costTier: 1,
          latencyTier: 1,
          reliability: 0.97,
        },
      ],
      preference: "cheapest",
    },
    asOf,
  );

  return {
    conclusion: ledger.conclusion,
    snapshotKey,
    routingNote: selection.rationale,
  };
}
