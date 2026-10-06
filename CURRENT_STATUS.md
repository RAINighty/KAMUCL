# CURRENT STATUS — KAMUCL 1.1.17 Windows

香港本地分钟日志：2026-10-07 01:36。交付Windows x64，Electron44.3.0。用户数据、历史人物计数、旧实例和未提交pelican-bicycle.html均保留；不操作wuhui，不强推，main仅cherry-pick保留独立历史。优化需求已撤回，Mac暂停。

- Project: KAMUCL
- Version or revision: 1.1.17；最终源码提交由归档外DELIVERY和版本标签精确绑定
- Status timestamp: 2026-10-07 02:03 Asia/Hong_Kong
- Build command: npm run build；Windows便携打包与node scripts/pack-windows-zip.cjs
- Build result: 成功，最终EXE为4517摘要；文档补齐不改变已测程序
- Test/validation commands: npm test；npx tsc --noEmit；npm run license:check；node scripts/verify-windows-package.cjs；真实界面专项
- Validation results: 1284项中1283通过、0失败、1Linux专属跳过；四主题及包通过；分项独立复评均≥8.5，范围和未覆盖另列
- Finished artifact: KAMUCL-1.1.17.exe、Windows紧凑ZIP及展开ZIP
- Artifact SHA256: 4517bdbb98b180c797f4e800a0d5c6d24b055db125876a3d27bf1b175332de2e；另两包摘要见下表

## Last verified state

| 文件 | 字节 | SHA256 |
| --- | ---: | --- |
| KAMUCL-1.1.17.exe | 97299290 | `4517bdbb98b180c797f4e800a0d5c6d24b055db125876a3d27bf1b175332de2e` |
| KAMUCL-1.1.17-windows-x64.zip | 97330862 | `b5ea1b46a4882ea93664eadac44a4534486bf829809a089572f86496f7783777` |
| KAMUCL-1.1.17-windows-x64-unpacked.zip | 142966591 | `264385d1f763521edeacada38d4df6fa823cb586f1df1b7325b19e5e9921057a` |

源码及交接ZIP摘要和最终master提交记录在归档外部DELIVERY-1.1.17.json及公开SHA256SUMS.txt，交接包根状态会追加已冻结源码ZIP摘要；不将包含自身的归档SHA写入归档内部。

## Completed

- MC百科公开中文关联查询：有界请求、可信来源、来源项目身份核对、过滤条件及原中文结果保留，失败提示和重试不缓存成无结果。
- 下拉按视口定位，键盘/滚动/重新点击可用；修复实际成品发现的Esc收起后同焦点输入框点击不能重开。标题X与拖动区分离，真实Win32点击关闭。
- 下蹲、飞行、本地未使用历史皮肤预览，离线预览不上传；经典/纤细模型和编辑器纹理行为保持。
- 游戏版本从可信元数据/客户端清单恢复，0.0.0不作可靠版本；Java、启动兼容与路径显示使用实际信息，无法证明时不猜测。
- 新配置.minecraft默认目录，旧.kamucl/自定义目录不变。MOD/材质/光影显示实际原生后端路径。
- 游戏窗口尺寸记忆默认关闭，所属进程正常窗口只读采样；仅正常退出写入原目标，保护用户期间的新设置，原子写入失败保持原数据。
- 第三方许可呈现Markdown标题、强调和安全链接；许可证全文保留。
- MOD预下载/校验和实际安装任务显示独立进度、实际字节或未知大小，取消/错误/重试保留原事务和哈希检查；下载中心可核对实际任务。

## 当前验证

最终1284项测试为1283通过、0失败、1Linux专属跳过；类型、许可、生产构建及完整Windows包验证通过。最终EXE上述4517摘要固定；507项产品输入构建前冻结并复核，后补QA/文档/证据单列，不冒称由它们重建成品。源码ZIP为最终Git blob原始字节，CRLF/LF等价性另核对。

四类主题、100%/125%、最小外框、真实前台坐标/键盘、原生X点击、关闭意图/保存失败/导出重读、后台暂停和真实MOD夹具落盘由本版证据及独立评审逐项核对。原始录屏、帧时间和失败不插帧、不改门槛。只控制专属测试PID/创建时间，不控制其他游戏。

## Remaining

真实Minecraft完整运行/退出、玩家原问题实例、物理1366×768屏幕、完整动效基准及人工听感继续待验证；不把本版夹具或评分当作这些项目完成。归档解压和公开发布身份由外部交付回执核对。

## Known issues and risks

本批真实官方查询不是真实服务MOD安装/游戏启动；本地合成MOD文件经真实生产下载/哈希/事务落盘。实际Minecraft进入世界、用户原0.0.0实例、实际Minecraft窗口尺寸退出链、物理1366×768主机、完整模型动效基准与人工听感未覆盖。Windows发行者签名未完成。Mac历史失败仍保留，不以本版Windows通过替代Mac/Intel/Linux/鸿蒙验收。

最终完整证据、历史失败及非自实现独立分项评分见docs/validation-1.1.17/；公开发布、远端提交、标签和附件身份由交付回执独立核对。

历史通用源码工具仍有限制：committed-source.cjs 的96MiB读取上限不足以读取本仓库；verify-source-archive.cjs 假定特定清单并拒绝已提交的嵌套out。它们未作为本版通过证据。本版源码保留全部获准Git原始blob，逐成员隐私与SHA复核，交接包另用原技能创建和运输解压验证；不遗漏历史已提交资料，也不加入用户未提交文件。

## Recommended next action

先按START_HERE完整解压并校验成品SHA，使用自己的账号和目录。开发者运行记录的许可命令，再按验证文档执行平台相关功能测试；后续实机验证单独补证，不能自行把未覆盖项改为通过。
