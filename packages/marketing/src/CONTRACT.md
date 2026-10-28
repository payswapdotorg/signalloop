# marketing

SignalLoop 营销智能域的纯契约模块：11 条规范记录（+发布记录）、覆盖率台账、连接器契约、能力路由与已审计来源目录。W1 冻结；实现是零 I/O 纯函数，持久化（W2）与工具接线（W3）在其它模块。

意图：把"证据诚信"从纪律问题变成类型问题——结论强度、覆盖状态、幂等键、路由决策全部由代码规则推导，模型无权改写。

不变量：

- 快照身份键 `(missionId, sourceId, sourceRecordId, observedAt, metricKey?)` 确定性；重复摄取必须是无副作用 no-op（W2 落库的合同）。
- 发布幂等键 `(missionId, artifactVersion, destination)`：重试发布永不复建（`publication_duplicate_blocked`）。
- 覆盖结论强度只有三档，由 `buildCoverageLedger` 的规则唯一决定；含 simulated 证据时结论必须点名。
- 能力路由没有合格模型时抛错，不允许静默降级（F7）。
- 来源目录是 `MARKETING-DATA-SOURCES.md` 的机器可读镜像；每条必须带 constraints、lastVerifiedAt 与验证证据；未审计来源抛错。
- 能力域互相独立（F8）：research / analytics / publishing_organic / scheduling / paid_ads 各自声明、各自授权。

与其它模块的交集在哪个 hook 点处理：连接器实现与工具在 `marketing-plugin`（apps/zcode-cli），SQLite 落库在 W2 的 marketing 数据库模块（scripts/check-sqlite-schema.ts 登记）；本模块不 import 任何运行时包。
