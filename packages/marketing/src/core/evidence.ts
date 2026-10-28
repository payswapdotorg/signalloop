/**
 * 证据记录与来源链（MARKETING-DATA-MODEL.md §1.7，North-Star G1）。
 *
 * 每一条实质性结论都必须能回溯到证据记录；证据记录必须带 provenance
 * 与 accessMethod，缺失即"无证据"，不允许用文案替代。
 */
import { z } from "zod";
import {
  acquisitionMethodSchema,
  confidenceSchema,
  isoDateTime,
  platformSchema,
  sourceTypeSchema,
} from "./identifiers.js";

/** 证据来源等级：verified > estimated > reported > simulated。排序用于渲染与审计。 */
export const evidenceProvenanceSchema = z.enum(["verified", "estimated", "reported", "simulated"]);
export type EvidenceProvenance = z.infer<typeof evidenceProvenanceSchema>;

export const evidenceRecordSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  /** 被证据支持的断言（一句话，可人工复核）。 */
  claim: z.string().min(1),
  sourceType: sourceTypeSchema,
  sourceId: z.string().nullable(),
  sourceRecordId: z.string().nullable(),
  platform: platformSchema.nullable(),
  url: z.string().url().nullable(),
  provenance: evidenceProvenanceSchema,
  acquisitionMethod: acquisitionMethodSchema,
  /** 取证时间窗口（起止同刻表示单点观察）。 */
  observedFrom: isoDateTime,
  observedTo: isoDateTime,
  connectorVersion: z.string().nullable(),
  confidence: confidenceSchema,
});
export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;

/**
 * 特征级证据引用：创意特征集里每条特征都要能指到素材内的证据位置
 * （帧号/时间戳/字幕片段），防止"摘要式"特征无中生有。
 */
export const evidenceSpanSchema = z.object({
  evidenceRecordId: z.string().min(1),
  /** 素材内定位：秒数、帧号或字幕区间等自由文本指针。 */
  locator: z.string().min(1),
});
export type EvidenceSpan = z.infer<typeof evidenceSpanSchema>;
