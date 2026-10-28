/**
 * marketing 对外契约：调用方要想正确调用就必须知道的一切都写在这里；其余对外不可见。
 * 来源：docs/marketing/MARKETING-ARCHITECTURE-LOCK.md §2（W1 冻结）。
 * 每个方法注释写清：前置/后置条件、幂等性、确定性。
 */
import type { ConnectorDescriptor } from "./connector/contract.js";
import type { ConnectorErrorCode } from "./connector/errors.js";
import type { CoverageState } from "./core/coverage.js";
import type { CoverageLedger, CoverageEntry } from "./core/coverage.js";
import type { RecordKind } from "./core/identifiers.js";
import type { PublicationIdentityInput, SnapshotIdentityInput } from "./core/temporal.js";
import type {
  adCreativeSchema,
  competitorEntitySchema,
  creativeArtifactSchema,
  creativeFeatureSetSchema,
  creativeHypothesisSchema,
  experimentRecordSchema,
  metricObservationSchema,
  organicContentSchema,
  productBriefSchema,
  publicationRecordSchema,
  simulationRunSchema,
} from "./core/records.js";
import type { evidenceRecordSchema, evidenceSpanSchema } from "./core/evidence.js";
import type { CapabilitySelection, CapabilitySelectionRequest } from "./capability/routing.js";

/** zod schema 注册表：按记录类型获取规范记录 schema（工具层可用其编译 JSON Schema）。 */
export interface MarketingSchemaRegistry {
  readonly product_brief: typeof productBriefSchema;
  readonly competitor_entity: typeof competitorEntitySchema;
  readonly ad_creative: typeof adCreativeSchema;
  readonly organic_content: typeof organicContentSchema;
  readonly metric_observation: typeof metricObservationSchema;
  readonly creative_feature_set: typeof creativeFeatureSetSchema;
  readonly evidence_record: typeof evidenceRecordSchema;
  readonly evidence_span: typeof evidenceSpanSchema;
  readonly creative_hypothesis: typeof creativeHypothesisSchema;
  readonly creative_artifact: typeof creativeArtifactSchema;
  readonly experiment_record: typeof experimentRecordSchema;
  readonly simulation_run: typeof simulationRunSchema;
  readonly publication_record: typeof publicationRecordSchema;
}

export interface RecordValidationInput {
  kind: RecordKind;
  value: unknown;
}

export interface RecordValidation {
  ok: boolean;
  /** 校验失败时的首条 zod 问题（人类可读；不展开全部以避免信息噪声）。 */
  issues: string[];
}

export interface MarketingIntelligenceContract {
  /** 规范记录 schema 注册表（只读）。 */
  readonly schemas: MarketingSchemaRegistry;
  /** 已审计来源目录（MARKETING-DATA-SOURCES.md 的机器可读镜像）。确定性：返回冻结数组。 */
  listSources(): readonly ConnectorDescriptor[];
  /** 按来源 id 取描述符；未知来源抛错（禁止静默接未审计来源）。入参为普通字符串：运行时目录校验即防线。 */
  describeSource(sourceId: string): ConnectorDescriptor;
  /** 快照身份键：确定性纯函数，同输入同输出（幂等落库基础，W2 依赖）。 */
  snapshotIdentity(input: SnapshotIdentityInput): string;
  /** 发布幂等键：确定性纯函数；重试发布必须复用同键。 */
  publicationIdentity(input: PublicationIdentityInput): string;
  /**
   * 台账组装：纯函数。结论强度由代码规则推导（sufficient_for_ranking /
   * sufficient_for_hypothesis / insufficient），永不由模型改写。
   */
  buildCoverageLedger(input: {
    missionId: string;
    entries: CoverageEntry[];
    asOf: string;
  }): CoverageLedger;
  /** 能力路由：确定性纯函数；无合格模型即抛错（调用方必须显式处理，F7）。 */
  resolveCapability(request: CapabilitySelectionRequest, now: string): CapabilitySelection;
  /** 错误码 → 覆盖状态映射（台账渲染唯一事实来源）。 */
  coverageStateForError(code: ConnectorErrorCode): CoverageState;
  /** 记录校验：不落库、不修改，仅按 kind 用注册表 schema 校验。 */
  validateRecord(input: RecordValidationInput): RecordValidation;
}
