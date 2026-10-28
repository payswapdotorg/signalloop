import { describe, expect, it } from "vitest";

// 契约测试只 import contract 与 module，不知道实现是谁；同一份测试应同时跑真实现与跨进程代理。
import type { MarketingIntelligenceContract } from "./contract.js";
import { marketingModule } from "./module.js";
import { marketingIntelligence } from "./instance.js";
import type { CoverageEntry } from "./core/coverage.js";
import { connectorErrorSchema } from "./connector/errors.js";

const port: MarketingIntelligenceContract = marketingIntelligence;
const asOf = "2026-10-28T10:42:54.000Z";

function entry(
  dimension: CoverageEntry["dimension"],
  state: CoverageEntry["state"],
  sourceId = "youtube-data-api",
): CoverageEntry {
  return {
    missionId: "mission_demo",
    sourceId,
    dimension,
    state,
    detail: "fixture",
    evidenceProvenance: state === "available" ? "verified" : null,
    asOf,
  };
}

describe("marketing contract", () => {
  it("declares its module manifest", () => {
    expect(marketingModule.id).toBe("marketing");
    expect(marketingModule.publicEntrypoints).toEqual(["index.ts", "contract.ts"]);
  });

  it("derives conclusion strength from code rules, never from models", () => {
    const ranking = port.buildCoverageLedger({
      missionId: "mission_demo",
      entries: [
        entry("organic_discovery", "available"),
        entry("ad_library", "available", "meta-ad-library"),
      ],
      asOf,
    });
    expect(ranking.conclusionStrength).toBe("sufficient_for_ranking");

    const hypothesis = port.buildCoverageLedger({
      missionId: "mission_demo",
      entries: [
        entry("organic_discovery", "available"),
        entry("ad_library", "limited", "meta-ad-library"),
        entry("conversion_performance", "not_connected", "meta-ads-manager"),
      ],
      asOf,
    });
    expect(hypothesis.conclusionStrength).toBe("sufficient_for_hypothesis");
    expect(hypothesis.conclusion).toContain("不足以对竞争对手的销售或广告回报做出确定性排序");
    expect(hypothesis.conclusion).toContain("未连接");

    const insufficient = port.buildCoverageLedger({
      missionId: "mission_demo",
      entries: [
        entry("organic_discovery", "unavailable"),
        entry("ad_library", "not_connected", "meta-ad-library"),
      ],
      asOf,
    });
    expect(insufficient.conclusionStrength).toBe("insufficient");
    expect(insufficient.conclusion).toContain("不生成任何策略结论");
  });

  it("flags simulated provenance honestly in the conclusion", () => {
    const ledger = port.buildCoverageLedger({
      missionId: "mission_demo",
      entries: [{ ...entry("organic_discovery", "available"), evidenceProvenance: "simulated" }],
      asOf,
    });
    expect(ledger.conclusion).toContain("模拟");
  });

  it("makes snapshot identity deterministic and collision-free", () => {
    const base = {
      missionId: "mission_demo",
      sourceId: "youtube-data-api",
      sourceRecordId: "yt_vid_001",
      observedAt: asOf,
      metricKey: "views",
    };
    expect(port.snapshotIdentity(base)).toBe(port.snapshotIdentity({ ...base }));
    expect(port.snapshotIdentity(base)).not.toBe(
      port.snapshotIdentity({ ...base, observedAt: "2026-10-29T00:00:00.000Z" }),
    );
    expect(port.snapshotIdentity(base)).not.toBe(
      port.snapshotIdentity({ ...base, metricKey: "shares" }),
    );
    expect(
      port.publicationIdentity({
        missionId: "mission_demo",
        artifactVersion: 2,
        destination: "tiktok/@brand",
      }),
    ).toBe(
      port.publicationIdentity({
        missionId: "mission_demo",
        artifactVersion: 2,
        destination: "tiktok/@brand",
      }),
    );
  });

  it("selects the cheapest eligible capability and declares fallbacks", () => {
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
            modelId: "pro",
            providerId: "p",
            taskKinds: ["strategy_synthesis"],
            supportsToolCall: true,
            supportsJsonSchemaOutput: true,
            contextWindowTokens: 128000,
            costTier: 4,
            latencyTier: 4,
            reliability: 0.99,
          },
          {
            modelId: "air",
            providerId: "p",
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
    expect(selection.selectedModelId).toBe("air");
    expect(selection.fallbackModelIds).toEqual(["pro"]);

    const jsonRequired = port.resolveCapability(
      {
        requirements: {
          taskKind: "text_classification",
          needsJsonOutput: true,
          needsToolUse: false,
          minContextTokens: 0,
          maxCostTier: 5,
        },
        eligibleModels: [
          {
            modelId: "nojson",
            providerId: "p",
            taskKinds: ["text_classification"],
            supportsToolCall: false,
            supportsJsonSchemaOutput: false,
            contextWindowTokens: 8000,
            costTier: 1,
            latencyTier: 1,
            reliability: 0.9,
          },
          {
            modelId: "jsonok",
            providerId: "p",
            taskKinds: ["text_classification"],
            supportsToolCall: false,
            supportsJsonSchemaOutput: true,
            contextWindowTokens: 8000,
            costTier: 2,
            latencyTier: 2,
            reliability: 0.9,
          },
        ],
        preference: "cheapest",
      },
      asOf,
    );
    expect(jsonRequired.selectedModelId).toBe("jsonok");

    expect(() =>
      port.resolveCapability(
        {
          requirements: {
            taskKind: "creative_generation",
            needsJsonOutput: false,
            needsToolUse: false,
            minContextTokens: 0,
            maxCostTier: 5,
          },
          eligibleModels: [
            {
              modelId: "textonly",
              providerId: "p",
              taskKinds: ["text_classification"],
              supportsToolCall: false,
              supportsJsonSchemaOutput: false,
              contextWindowTokens: 8000,
              costTier: 1,
              latencyTier: 1,
              reliability: 0.9,
            },
          ],
          preference: "cheapest",
        },
        asOf,
      ),
    ).toThrow(/no eligible model/);
  });

  it("validates canonical records through the schema registry", () => {
    const brief = {
      id: "brief_1",
      missionId: "mission_demo",
      createdAt: asOf,
      product: "LumiSkin LED mask",
      category: "beauty device",
      audience: "US women 25-45",
      country: "US",
      platforms: ["tiktok"],
      offer: "$89 launch discount",
      objective: "sales",
      desiredOutcome: "attributed purchases",
      constraints: [],
      positioning: null,
      rawInput: "we sell an at-home LED therapy mask",
    };
    expect(port.validateRecord({ kind: "product_brief", value: brief }).ok).toBe(true);
    expect(
      port.validateRecord({ kind: "product_brief", value: { ...brief, objective: "vibes" } }).ok,
    ).toBe(false);
    const badConfidence = {
      id: "c1",
      missionId: "mission_demo",
      createdAt: asOf,
      name: "GlowPro",
      handles: [],
      platform: "meta",
      identityConfidence: 1.5,
      relevanceReason: "same category keyword",
      status: "candidate",
      sourceId: null,
      evidenceRefs: [],
    };
    const result = port.validateRecord({ kind: "competitor_entity", value: badConfidence });
    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("maps connector errors to coverage states deterministically", () => {
    expect(port.coverageStateForError("auth_required")).toBe("not_connected");
    expect(port.coverageStateForError("rate_limited")).toBe("limited");
    expect(port.coverageStateForError("dataset_unavailable")).toBe("unavailable");
    const parsed = connectorErrorSchema.safeParse({
      code: "auth_required",
      capabilityDomain: "research",
      occurredAt: asOf,
    });
    expect(parsed.success).toBe(true);
    expect(
      connectorErrorSchema.safeParse({ code: "auth_required", occurredAt: asOf }).success,
    ).toBe(false);
  });

  it("keeps the source catalog audited and honest", () => {
    const sources = port.listSources();
    expect(sources.length).toBeGreaterThanOrEqual(5);
    for (const source of sources) {
      expect(source.constraints.length).toBeGreaterThan(0);
      expect(source.lastVerifiedAt).toBeTruthy();
      expect(source.acquisitionMethods.length).toBeGreaterThan(0);
    }
    expect(port.describeSource("meta-ad-library").constraints).toContain("EU/UK");
    expect(() => port.describeSource("not-audited-source")).toThrow();
  });
});
