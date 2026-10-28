/**
 * @zcode/marketing 公共入口：规范记录、覆盖率、连接器契约、能力路由与来源目录。
 * 管理模块的 publicEntrypoints：index.ts + contract.ts（架构检查只允许深导出到这两处）。
 */
export { marketingIntelligence } from "./instance.js";
export { createMarketingIntelligence } from "./default.js";
export type {
  MarketingIntelligenceContract,
  MarketingSchemaRegistry,
  RecordValidation,
  RecordValidationInput,
} from "./contract.js";

export { marketingModule } from "./module.js";

export type {
  CapabilityDomain,
  CapabilityDeclaration,
  ConnectorAccessState,
  ConnectorDescriptor,
  ConnectorPage,
  MarketingConnector,
  PageCursor,
} from "./connector/contract.js";
export type { ConnectorError, ConnectorErrorCode } from "./connector/errors.js";
export { connectorErrorSchema, connectorErrorCodeSchema } from "./connector/errors.js";

export {
  capabilityDomainSchema,
  capabilityDeclarationSchema,
  connectorAccessStateSchema,
  connectorDescriptorSchema,
  pageCursorSchema,
} from "./connector/contract.js";

export type {
  CapabilityRequirement,
  CapabilitySelection,
  CapabilitySelectionRequest,
  ModelCapabilityProfile,
  TaskKind,
} from "./capability/routing.js";
export {
  capabilityRequirementSchema,
  capabilitySelectionRequestSchema,
  capabilitySelectionSchema,
  modelCapabilityProfileSchema,
  resolveCapability,
  taskKindSchema,
} from "./capability/routing.js";

export type {
  AcquisitionMethod,
  Confidence,
  GoalType,
  IsoDateTime,
  ObservedTargetType,
  Platform,
  RecordKind,
  SourceId,
  SourceRecordId,
  SourceType,
} from "./core/identifiers.js";
export {
  acquisitionMethodSchema,
  confidenceSchema,
  goalTypeSchema,
  isoDateTime,
  missionIdSchema,
  observedTargetTypeSchema,
  platformSchema,
  recordKindSchema,
  sourceIdSchema,
  sourceTypeSchema,
} from "./core/identifiers.js";

export type {
  AsOfQuery,
  MetricDefinitionRef,
  PublicationIdentityInput,
  SnapshotIdentityInput,
  TemporalMode,
  TemporalStamp,
} from "./core/temporal.js";
export {
  asOfQuerySchema,
  metricDefinitionRefSchema,
  publicationIdentity,
  publicationIdentityInputSchema,
  snapshotIdentity,
  snapshotIdentityInputSchema,
  temporalModeSchema,
  temporalStampSchema,
} from "./core/temporal.js";

export type {
  CoverageDimension,
  CoverageEntry,
  CoverageLedger,
  CoverageState,
  ConclusionStrength,
} from "./core/coverage.js";
export {
  buildCoverageLedger,
  conclusionStrengthSchema,
  coverageDimensionSchema,
  coverageEntrySchema,
  coverageLedgerSchema,
  coverageStateSchema,
} from "./core/coverage.js";

export type { EvidenceProvenance, EvidenceRecord, EvidenceSpan } from "./core/evidence.js";
export {
  evidenceProvenanceSchema,
  evidenceRecordSchema,
  evidenceSpanSchema,
} from "./core/evidence.js";

export type {
  AdCreative,
  CompetitorEntity,
  CreativeArtifact,
  CreativeFeatureSet,
  CreativeHypothesis,
  ExperimentRecord,
  MetricObservation,
  OrganicContent,
  OpportunityScores,
  ProductBrief,
  PublicationRecord,
  SimulationRun,
} from "./core/records.js";
export {
  adCreativeSchema,
  competitorEntitySchema,
  competitorStatusSchema,
  creativeArtifactSchema,
  creativeFeatureSetSchema,
  creativeHypothesisSchema,
  experimentRecordSchema,
  experimentStatusSchema,
  metricObservationSchema,
  organicContentSchema,
  opportunityScoresSchema,
  productBriefSchema,
  publicationRecordSchema,
  publicationStatusSchema,
  simulationRunSchema,
} from "./core/records.js";

export { describeSource, listSources } from "./sources/catalog.js";
