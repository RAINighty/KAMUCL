# CURRENT STATUS

## Identity

- Project: KAMUCL。
- Version or revision: 1.1.7，应用实现 bf37aa8，最终对应源码标签 v1.1.7。
- Status timestamp: 2026-10-02 05:18（Asia/Hong_Kong）。
- 本批完成自由调色板、顶栏七人像素互动及音效、七图混播管理、社区卡片收藏。
- master 与 main 保留独立历史，本批提交通过 cherry-pick 同步。

## Last verified state

- Build command: npm ci；node scripts/build-bridge.cjs；npx tsc --noEmit；npm run build。
- Build result: 工作区生产构建和独立干净应用源码构建通过。
- Test/validation commands: npm test；node scripts/check-licenses.cjs；平台与 GUI 验证脚本。
- Validation results: 588 / 588 测试通过，无失败、取消或跳过；下列成品检查通过。
- Finished artifact: 下表七个 Windows / Mac 成品。
- Artifact SHA256: 下表记录每个成品的完整 SHA256。

- Windows 便携 EXE、中文路径 ZIP 的冷/热启动、实际展开文件逐项摘要及完整备用 ZIP：通过。
- 深色 black-orange、浅色 blue-white、自定义主题全页面回归，以及 960 最小窗口和 1.25 / 1.5 缩放：通过。
- 调色控件同步、无效输入、吸色、基础层不透明、外层透明度、撤销、实际 PNG 导出及色板保存：通过。
- 一次指针跨七人、反向横扫、独立反馈、停留不重复、稳定排序、键盘、计数保存及幂等重试：通过。
- 原创音效实际声音节点和混音录音、连续重叠及峰值无削波：通过。硬件人工听测未覆盖。
- 正常/减少动态效果分别检查；真实原生窗口隐藏后 WebGL 停止绘制，音频持续暂停，关闭释放：通过。
- 七张新图逐像素无损一致、受管图片混播、排序、时长、全关、停用保留文件及主题往返：通过。
- 两平台外置 Mod 星标、详情/安装共享状态、真实 IPC 和磁盘保存、失败恢复：通过；社区响应使用隔离夹具。
- Mac arm64 / x64 原生 APP 和挂载 DMG：通过；皮肤、新功能 GUI、材质、真实 Minecraft 26.2 及保存退出：通过。
- 独立应用源码解压后 npm ci、JDK 17.0.12 桥接重建、类型、生产构建和许可：通过；781 文件构建前后不变。

证据位于 docs/validation-1.1.7/。最终 Mac CI 为 36926471866，源码 cdaa9de；
两种架构的实际 job / attempt 记录及成功步骤见 mac 证据；
不把旧 run 或继承的成功 job 记录当作当前实际执行。
72adab2、8b72b39、cdaa9de 仅改善验证脚本的完成条件和诊断，不改变 bf37aa8 的发行应用代码。

## Completed

功能、资源来源和兼容处理见 docs/FEATURES_1.1.7.md。
皮肤绘制、VoxLink、投影调度/转换、模组安装、Windows 内存整理等保留功能见 docs/FEATURES_1.1.6.md。
VoxLink 源码基线、逐值协议审查及实际网络/模拟协议的区别见 docs/VOXLINK_AUDIT_1.1.6.md。
START_HERE.md 和 docs/CORRESPONDING_SOURCE.md 给出完整 JDK、Node、对应运行库及重建方法。

## Remaining

硬件扬声器/耳机的人工主观听感未验收。Mac 新功能验证使用深色主题，未逐一覆盖每种
Mac 主题、页面和窗口组合；Windows 已完成三种主题的全页面回归。
真实微软皮肤上传、真实工单附件提交、公网对称 NAT、跨 Java 客户端仍需实际参与者。
保留功能没有覆盖所有投影 MOD 的游戏内加载、未来 26.x、所有收藏依赖组合、
Windows 启动前整理的真实游戏全过程及每种受保护进程，详见 1.1.6 原始记录。
隔离账号、模拟服务、回环协议及实际网络证据分开记录，未完成项不描述为已通过。

## Known issues and risks

参考 MC 截图无法恢复隐藏像素，七人纹理按服装风格补全，不声称与原始皮肤逐像素相同。
投影缺少可靠迁移规则时明确提示损失或拒绝转换；保留原文件。
Mac 仅 ad-hoc 签名，没有 Apple Developer ID 签名或公证。
内存整理独立实现，不含 PCL 程序或未公开代码，不结束进程或改变长期内存策略。

## 成品身份

以下七个成品选入交接包 _handoff/artifacts/。源码 ZIP 与交接 ZIP 的外层摘要见
Release SHA256SUMS.txt，避免文档自身摘要循环。干净源码构建不承诺签名和打包元数据逐字节可重现。

| 文件 | 字节数 | SHA256 |
| --- | ---: | --- |
| KAMUCL-1.1.7.exe | 97259436 | d13d82eb8f3428771d76a10f978b0166497823740ced0fb014d04540a64aaa77 |
| KAMUCL-1.1.7-windows-x64.zip | 97290900 | 4cbfc22d4d6d9f1c89fbd87912aa249af5dd6d509a2362c3becc8226ee574b07 |
| KAMUCL-1.1.7-windows-x64-unpacked.zip | 143017593 | e12e93150d0b9d56e22e08929317f5d3c49e6e133f7592499a7ab67e954b7cac |
| KAMUCL-1.1.7-mac-arm64.dmg | 108630414 | b9a3a14afa1a7e7dd5912191b236b30074ac5c27adf2c8fe8350efe1e9164fde |
| KAMUCL-1.1.7-mac-arm64.zip | 100115685 | b47f41452e5da44d6858aab17ef5d2d54c30f4e4d1c70730a50c2cb89920c0ad |
| KAMUCL-1.1.7-mac-x64.dmg | 115803274 | 9063d7ec7ed938ba55ab1faa5f8cb2a81f1660554584c5930bda7f0c813a9cb8 |
| KAMUCL-1.1.7-mac-x64.zip | 106255717 | 57ff3cbae85fdf991d592e1b2c1fe8b4ab7dd08cab353562f2598740be15af24 |

## Recommended next action

先核对下载文件外层 SHA256，再核对交接包 _handoff/manifest.json 或源码包 SOURCE-MANIFEST.json。
交接包的便携验证入口为 node scripts/check-licenses.cjs；START_HERE.md 列出完整构建与功能验证命令。
源码和交接包不含账户、凭据、游戏、下载缓存、依赖目录或无关个人文件。
