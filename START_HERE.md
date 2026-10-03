# START HERE — KAMUCL 1.1.10

当前交付为 Windows x64；下载并运行 KAMUCL-1.1.10.exe，或解压紧凑 ZIP。需要绕过自解压包装器时用 windows-x64-unpacked ZIP。两种 Mac 架构继续暂停。

源码需要 Node.js 22+、npm、Git、完整 JDK 17+；Windows 使用 PowerShell。运行 npm ci、node scripts/build-bridge.cjs、npx tsc --noEmit、npm test、npm run license:check、npm run build；打包 npm run dist:win。已验证的 Windows 使用 Electron 44.3.0。

交接包验证入口为 scripts/check-licenses.cjs，记录命令 ["node", "scripts/check-licenses.cjs"]。比较外层 SHA256 后核对 _handoff/manifest.json 与 _handoff/SHA256SUMS.txt 并运行记录命令。成品位于 _handoff/artifacts。源码包另含 SOURCE-MANIFEST.json。

当前验证与边界见 docs/RELEASE-1.1.10.md 和 docs/validation-1.1.10/summary.json；图片、账号及游戏实例为个人运行数据，未打入源码或 EXE。升级无需删除实例或存档。下方是以前版本的历史说明，仅供追溯。

---

# KAMUCL 1.1.9 交付入口（Windows）

**用户已将本轮交付限定为 Windows，暂缓 Intel 和 Apple Silicon Mac 的开发、构建与验收。验收范围以 CURRENT_STATUS.md 为准；公开状态、版本标签和下载附件以 GitHub 的 v1.1.9 Release 及外部 SHA256SUMS.txt 为准。**

本轮交付包含皮肤编辑器布局、主题勾选控件与安装弹窗、LOGO 原位卡慕互动、统一整合包分类导入的源码、资源、锁文件、测试、许可证及 Windows 成品。功能见 docs/FEATURES_1.1.9.md；实际覆盖、历史失败和未覆盖项见 CURRENT_STATUS.md 与 docs/RELEASE_1.1.9.md。详细证据位于交接包 release/validation-1.1.9/Delivery/；用户整合包、存档、浏览器配置和账号不包含在内。暂停前的 Mac 失败证据保留，不能视为 Mac 合格或已交付。

- Project: KAMUCL 1.1.9。
- Deliverable: 本轮实现、Windows 成品、完整源码及验证证据。
- Packaged artifact: Windows EXE / compact ZIP / unpacked ZIP；不包含 Mac 安装包。
- Intended receiver: 启动器使用者及接续开发者。

## Use the deliverable

Windows x64 使用 KAMUCL-1.1.9.exe，或解压 KAMUCL-1.1.9-windows-x64.zip。保留 EXE 旁的 KAMUCL-runtime 缓存；无法运行自解压包装器时使用 unpacked ZIP。本轮不提供 Mac 下载或安装说明。

交接包成品在 _handoff/artifacts/；GitHub Release 提供 Windows 独立下载。升级保留用户图片、收藏、设置和所有历史人物计数；另六人的界面退出，不删除计数。此前误导入的实例不会自动删除。

## Prerequisites

- Operating system: Windows x64。
- Runtime/tool versions: 源码需要 Node.js 22+、npm、完整 JDK 17+、Git。Windows 成品 Electron 44.3.0。

将 JAVA_HOME 指向包含 javac 与 jar 的完整 JDK，Windows 使用 PowerShell。工具和游戏依赖需要网络访问，缓存不随包交付。账号、发布令牌及 VoxLink 工单凭据另行提供。

## Setup

    npm ci
    node scripts/build-bridge.cjs
    npx tsc --noEmit
    npm test
    npm run license:check
    npm run build

Windows 成品命令为 npm run dist:win。本轮不执行 Mac 构建或验收；源码中既有 Mac 流程保留，Windows 构建不代表 Mac 通过。

## Verify

无需安装 npm 依赖即可运行许可证与对应源码检查，失败时退出码非零：

    node scripts/check-licenses.cjs

交接记录命令为 ["node", "scripts/check-licenses.cjs"]。_handoff/manifest.json 与 _handoff/SHA256SUMS.txt 记录逐文件 SHA256。独立源码包用 SOURCE-MANIFEST.json；发行附件用外部 SHA256SUMS.txt。先核对外层摘要，再解压核对逐文件摘要并执行命令。干净构建通过不表示包含签名和打包元数据的成品逐字节相同。

## 验证入口与边界

- npm test：公开合成包分类、安全路径、事务回滚、互动队列和持久化、皮肤编辑状态机等。
- scripts/verify-windows-package.cjs：最终 Windows 成品、中文路径、冷/热启动、ZIP 解压与完整文件摘要。
- scripts/verify-ui-refinement.cjs：隔离成品 GUI；KAMUCL_EXTENSION_GUI=1 覆盖全部本轮模块。KAMUCL_UI_MODULE 可指定 header、skin118、palette、gallery、gallery118、import119、selection119。
- scripts/verify-kamu-logo-119-ui.cjs：实际模型就绪、键盘焦点、连续点击、声音源、关闭重试、隐藏与释放；旧 verify-mascot-header-ui.cjs 按版本选择。
- scripts/verify-pcl-import-119.cjs <private-export.zip>：真实服务导入和所属游戏窗口验证，结果仅写 ignored out。私有 ZIP 由使用者提供，不包含在源码。
- scripts/verify-mac.cjs、scripts/verify-mac-game.cjs：原生 APP / DMG 及真实 Minecraft 窗口与世界检查。
- scripts/verify-kamu-native-trace-119.cjs：独立进程的原生合成器诊断，记录实际 BeginFrame、绘制、提交及窗口状态；带追踪的数据不能替代正常动效验收。
- scripts/verify-kamu-native-video-119.cjs 与 scripts/mac-logo-capture-119.swift：独立 ScreenCaptureKit 原生 LOGO 观察，保存实际窗口身份、原始 BGRA、PTS、采样状态及无损 PNG；不替代正式 CDP 录屏或其低于目标的结果。scripts/native-video-evidence-119.cjs 核对阶段与归档完整性。未获屏幕录制权限时保留失败，不请求权限弹窗。
- scripts/verify-kamu-feedback-scale-119-ui.cjs：125%／150% 缩放下实际点击、接触帧与声音计数核对；附加截图采集明确作为诊断。
- scripts/verify-source-archive.cjs：最终源码包干净解压、成员与摘要、安装依赖、类型和生产构建。

夹具社区响应不等同真实在线收藏安装；数值音频检查不等同耳机或扬声器听感。真实微软上传、硬件主观听测、用户存档实际游玩等未覆盖项以发行报告为准。

历史原始截图帧与失败记录已打包为 KAMUCL-1.1.9-validation-history-part001.zip 至 part005.zip，均可独立解压；完整清单为 KAMUCL-1.1.9-validation-history-index.json。五卷共 155056 个文件、5827360601 字节原始内容，已逐文件核对源目录与干净解压后的大小、SHA256 和完整清单；每卷小于 GitHub 单附件 2GB 限制。包含暂停前的 Mac 失败及 Windows 长路径漏收证据，失败指标保持原值。交接包完整携带所有最终原始证据、历史帧时间及日志；历史图片、视频、原像素和音频由上述五卷完整保存，避免重复使交接 ZIP 超过单附件限制。Delivery/HISTORY-REFERENCE.json 列出各附件大小、SHA256 与每个未重复媒体成员所在分卷及摘要。临时浏览器缓存单独列为隐私排除，原始历史帧和失败结果没有删改；交接包运输校验与外部历史附件闭合分别验证，接收者需核对索引和全部五卷。
