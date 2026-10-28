/**
 * 已审计来源目录（MARKETING-DATA-SOURCES.md §1–§2 的机器可读镜像）。
 *
 * 每条 lastVerifiedAt / verificationEvidence 必须与文档 §1 的探针记录
 * 逐条对应；来源接入前先更新文档，再更新本目录（spec-first）。
 * 首选 ad 来源 = meta-ad-library，首选 organic 来源 = youtube-data-api（W1 出口）。
 */
import type { ConnectorDescriptor } from "../connector/contract.js";

export const SOURCE_CATALOG: readonly ConnectorDescriptor[] = [
  {
    id: "meta-ad-library",
    platform: "meta",
    displayName: "Meta Ad Library API",
    capabilityDomains: {
      research: { declaration: "supported_with_scopes", scopes: ["ads_archive_basic"] },
      analytics: "not_supported",
      publishing_organic: "not_supported",
      scheduling: "not_supported",
      paid_ads: "not_supported",
    },
    accessState: { kind: "not_connected" },
    regions: ["EU", "UK", "GLOBAL_POLITICAL_ISSUE_ONLY"],
    quotas: "API-level rate limiting applies; token type determines reach",
    metricSemantics: { impressions: "v21.0 delivery-api semantics" },
    acquisitionMethods: ["official_api"],
    documentationUrl: "https://www.facebook.com/ads/archive/api",
    constraints:
      "官方 API 仅覆盖过去一年在 EU/UK 投放的广告；全球七年范围仅适用于政治与社会议题广告。不是通用商业广告存档。",
    lastVerifiedAt: "2026-10-28T10:42:54.000Z",
    verificationEvidence:
      "无凭证探测：HTTP 400，body={error:{message:'(#100) The parameter ad_reached_countries is required.',type:'OAuthException',code:100}} —— 端点可达且请求校验与 EU/UK 透明度口径一致",
  },
  {
    id: "youtube-data-api",
    platform: "youtube",
    displayName: "YouTube Data API v3",
    capabilityDomains: {
      research: { declaration: "supported_with_scopes", scopes: ["youtube.readonly"] },
      analytics: "not_supported",
      publishing_organic: "not_supported",
      scheduling: "not_supported",
      paid_ads: "not_supported",
    },
    accessState: { kind: "not_connected" },
    regions: ["GLOBAL"],
    quotas: "Key-gated daily quota units; search is quota-expensive",
    metricSemantics: { views: "v3 videos.statistics semantics" },
    acquisitionMethods: ["official_api"],
    documentationUrl: "https://developers.google.com/youtube/v3/docs",
    constraints:
      "公开指标是有效性能信号，但不含创作者私有分析（观看时长、留存、流量来源）。API key 即可读公开数据。",
    lastVerifiedAt: "2026-10-28T10:42:54.000Z",
    verificationEvidence:
      "无效 key 探测：HTTP 400，body={error:{code:400,message:'API key not valid. Please pass a valid API key.'}} —— 端点存活且 key 门控生效",
  },
  {
    id: "tiktok-commercial-content",
    platform: "tiktok",
    displayName: "TikTok Commercial Content API",
    capabilityDomains: {
      research: "awaiting_approval",
      analytics: "not_supported",
      publishing_organic: "not_supported",
      scheduling: "not_supported",
      paid_ads: "not_supported",
    },
    accessState: { kind: "not_connected" },
    regions: ["EU"],
    quotas: "Unknown until app approval",
    metricSemantics: {},
    acquisitionMethods: ["official_api"],
    documentationUrl: "https://developers.tiktok.com/doc/commercial-content-api",
    constraints: "需要获批应用；文档化数据集最初覆盖 EU 广告与商业内容。不是首个发布版本的依赖项。",
    lastVerifiedAt: "2026-10-28T10:42:54.000Z",
    verificationEvidence:
      "open.tiktokapis.com 网络可达（未授权探测 404/401 族响应）；developers.tiktok.com HTTP 200。正式访问待批准应用（WO-102）",
  },
  {
    id: "tiktok-research-tools",
    platform: "tiktok",
    displayName: "TikTok Research Tools",
    capabilityDomains: {
      research: "awaiting_approval",
      analytics: "not_supported",
      publishing_organic: "not_supported",
      scheduling: "not_supported",
      paid_ads: "not_supported",
    },
    accessState: { kind: "not_connected" },
    regions: ["US", "EU"],
    quotas: "Research-agreement gated",
    metricSemantics: {},
    acquisitionMethods: ["official_api"],
    documentationUrl: "https://developers.tiktok.com/doc/research-api-overview",
    constraints:
      "普通商业用户不符合资格；绝不能作为产品的前置依赖（MARKETING-DATA-SOURCES.md §2）。仅在取得研究协议时启用。",
    lastVerifiedAt: "2026-10-28T10:42:54.000Z",
    verificationEvidence: "文档门户可达（HTTP 200）；资格规则以官方文档为准",
  },
  {
    id: "youtube-analytics-api",
    platform: "youtube",
    displayName: "YouTube Analytics API",
    capabilityDomains: {
      research: "not_supported",
      analytics: { declaration: "supported_with_scopes", scopes: ["yt-analytics.readonly"] },
      publishing_organic: "not_supported",
      scheduling: "not_supported",
      paid_ads: "not_supported",
    },
    accessState: { kind: "not_connected" },
    regions: ["GLOBAL"],
    quotas: "Quota-gated per project",
    metricSemantics: {},
    acquisitionMethods: ["authorized_account_or_import"],
    documentationUrl: "https://developers.google.com/youtube/analytics",
    constraints:
      "需要频道所有者 OAuth 授权。仅用于用户自有频道（own-account 数据），与竞对观察严格区分标注。",
    lastVerifiedAt: "2026-10-28T10:42:54.000Z",
    verificationEvidence: "官方文档可达；OAuth 流程未在本环境执行（WO-102）",
  },
] as const;

export function listSources(): readonly ConnectorDescriptor[] {
  return SOURCE_CATALOG;
}

export function describeSource(sourceId: string): ConnectorDescriptor {
  const found = SOURCE_CATALOG.find((source) => source.id === sourceId);
  if (!found) {
    throw new Error(`unknown source: ${sourceId}（先在 MARKETING-DATA-SOURCES.md 登记再接入）`);
  }
  return found;
}
