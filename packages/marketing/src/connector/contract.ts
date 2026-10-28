/**
 * 平台连接器契约（PLATFORM-CONNECTOR-CONTRACT.md §1–§4）。
 *
 * F8 铁律：一个能力域的授权永不隐含另一个。域默认全部 not_supported，
 * 连接器显式声明、运行时逐调用校验。
 */
import { z } from "zod";
import {
  acquisitionMethodSchema,
  isoDateTime,
  platformSchema,
  sourceIdSchema,
} from "../core/identifiers.js";
import type { ConnectorError } from "./errors.js";

/** 权限域：paid_ads 首个发布周期不实现（架构锁定 §2 F8）。 */
export const capabilityDomainSchema = z.enum([
  "research",
  "analytics",
  "publishing_organic",
  "scheduling",
  "paid_ads",
]);
export type CapabilityDomain = z.infer<typeof capabilityDomainSchema>;

export const capabilityDeclarationSchema = z.enum([
  "not_supported",
  "supported",
  "supported_with_scopes",
  "awaiting_approval",
]);
export type CapabilityDeclaration = z.infer<typeof capabilityDeclarationSchema>;

export const connectorAccessStateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("not_connected") }),
  z.object({ kind: z.literal("demo") }),
  z.object({
    kind: z.literal("authorized"),
    scopes: z.array(z.string()),
    accountRef: z.string().min(1),
    expiresAt: isoDateTime.nullable(),
  }),
  z.object({ kind: z.literal("expired") }),
  z.object({ kind: z.literal("revoked") }),
]);
export type ConnectorAccessState = z.infer<typeof connectorAccessStateSchema>;

export const pageCursorSchema = z.object({
  /** 平台不透明游标 + 查询快照（分页重放必须稳定，PCC §4）。 */
  opaque: z.string().min(1),
  pageSize: z.number().int().min(1),
  querySnapshot: z.string().min(1),
});
export type PageCursor = z.infer<typeof pageCursorSchema>;

/** 连接器描述符：连接器中性架构的注册单元。 */
export const connectorDescriptorSchema = z.object({
  id: sourceIdSchema,
  platform: platformSchema,
  displayName: z.string().min(1),
  capabilityDomains: z.record(
    capabilityDomainSchema,
    z.union([
      capabilityDeclarationSchema,
      z.object({
        declaration: capabilityDeclarationSchema,
        scopes: z.array(z.string()).default([]),
      }),
    ]),
  ),
  accessState: connectorAccessStateSchema,
  /** 平台官方允许的地区声明（覆盖台账渲染依据）。 */
  regions: z.array(z.string()).default([]),
  quotas: z.string().nullable(),
  /** 指标口径版本登记（MARKETING-DATA-MODEL.md §4）。 */
  metricSemantics: z.record(z.string(), z.string()).default({}),
  acquisitionMethods: z.array(acquisitionMethodSchema).min(1),
  documentationUrl: z.string().url(),
  constraints: z.string().min(1),
  lastVerifiedAt: isoDateTime,
  verificationEvidence: z.string().min(1),
});
export type ConnectorDescriptor = z.infer<typeof connectorDescriptorSchema>;

/** 研究域查询面（连接器实现可选能力；未声明即不存在）。 */
export interface MarketingConnector {
  readonly descriptor: ConnectorDescriptor;
  listCapabilityDomains(): readonly CapabilityDomain[];
  readonly research?: {
    searchAds?(query: { missionId: string; page: PageCursor }): Promise<ConnectorPage>;
    searchOrganic?(query: { missionId: string; page: PageCursor }): Promise<ConnectorPage>;
  };
  readonly analytics?: {
    fetchAccountMetrics?(query: { missionId: string; accountRef: string }): Promise<ConnectorPage>;
  };
  readonly publishing_organic?: {
    /** 生成平台规范化的发布包（dry-run 校验，不发布）。 */
    prepare?(draft: { identityKey: string; caption: string }): Promise<{ preparedPackage: string }>;
    /** 发布：幂等，identityKey 重试必须返回原结果（PCC §4）。 */
    publish?(approval: {
      identityKey: string;
      approvedBy: string;
    }): Promise<{ platformPostId: string; postUrl: string }>;
  };
  readonly measurement?: {
    observe?(query: { missionId: string; sourceRecordId: string }): Promise<ConnectorPage>;
  };
}

/** 结果页：行是规范记录的原料（sourceRecordId 必带），错误是类型化数据。 */
export interface ConnectorPage {
  rows: ReadonlyArray<{ sourceRecordId: string; raw: unknown }>;
  nextCursor: PageCursor | null;
  /** partial_results 时必填且逐页附带 provenance。 */
  errors: ConnectorError[];
}
