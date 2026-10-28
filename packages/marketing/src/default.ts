/**
 * marketing 契约的参考实现：纯函数、零 I/O（可在任何进程/客户端/代理后运行，
 * 同一份 contract.test.ts 也应能跑跨进程代理）。
 */
import type { ZodType } from "zod";
import type { MarketingIntelligenceContract } from "./contract.js";
import { resolveCapability } from "./capability/routing.js";
import { coverageStateForError as transitionForError } from "./connector/errors.js";
import type { ConnectorErrorCode } from "./connector/errors.js";
import { buildCoverageLedger } from "./core/coverage.js";
import type { CoverageState } from "./core/coverage.js";
import { evidenceRecordSchema, evidenceSpanSchema } from "./core/evidence.js";
import {
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
import type { RecordKind } from "./core/identifiers.js";
import { publicationIdentity, snapshotIdentity } from "./core/temporal.js";
import { describeSource, listSources } from "./sources/catalog.js";

export function createMarketingIntelligence(): MarketingIntelligenceContract {
  const schemas = {
    product_brief: productBriefSchema,
    competitor_entity: competitorEntitySchema,
    ad_creative: adCreativeSchema,
    organic_content: organicContentSchema,
    metric_observation: metricObservationSchema,
    creative_feature_set: creativeFeatureSetSchema,
    evidence_record: evidenceRecordSchema,
    evidence_span: evidenceSpanSchema,
    creative_hypothesis: creativeHypothesisSchema,
    creative_artifact: creativeArtifactSchema,
    experiment_record: experimentRecordSchema,
    simulation_run: simulationRunSchema,
    publication_record: publicationRecordSchema,
  } as const;

  const byKind: Record<RecordKind, (typeof schemas)[keyof typeof schemas]> = {
    product_brief: schemas.product_brief,
    competitor_entity: schemas.competitor_entity,
    ad_creative: schemas.ad_creative,
    organic_content: schemas.organic_content,
    metric_observation: schemas.metric_observation,
    creative_feature_set: schemas.creative_feature_set,
    evidence_record: schemas.evidence_record,
    creative_hypothesis: schemas.creative_hypothesis,
    creative_artifact: schemas.creative_artifact,
    experiment_record: schemas.experiment_record,
    simulation_run: schemas.simulation_run,
    publication_record: schemas.publication_record,
  };

  return {
    schemas,
    listSources,
    describeSource: (sourceId) => describeSource(sourceId),
    snapshotIdentity,
    publicationIdentity,
    buildCoverageLedger,
    resolveCapability,
    coverageStateForError: (code: ConnectorErrorCode): CoverageState =>
      transitionForError(code) as CoverageState,
    validateRecord: ({ kind, value }) => {
      const schema: ZodType = byKind[kind];
      const parsed = schema.safeParse(value);
      return {
        ok: parsed.success,
        issues: parsed.success
          ? []
          : parsed.error.issues
              .slice(0, 3)
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      };
    },
  };
}
