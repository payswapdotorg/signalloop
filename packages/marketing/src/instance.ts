/** 单例：进程内默认实例（跨进程代理场景请用 createMarketingIntelligence 自建）。 */
import { createMarketingIntelligence } from "./default.js";
import type { MarketingIntelligenceContract } from "./contract.js";

export const marketingIntelligence: MarketingIntelligenceContract = createMarketingIntelligence();
