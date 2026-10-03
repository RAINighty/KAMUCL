# START HERE — KAMUCL 1.1.11 接续候选

2026-10-04 06:30（Asia/Hong_Kong）更新：第三轮 `2b1e6f1` 的 Mac run `37157548139` 与 Linux run `37157548122` 均完整结束为 failure，没有取消或死锁。Mac 两架构各 853 项为 846 通过、3 失败、4 项既有系统限定 skip；失败为测试临时目录别名 `/var` 与产品正确返回的 `/private/var` 规范路径不同。Linux x64 为 850 通过、0 失败、3 skip 后进入生产构建，但旧打包检查要求官方 Electron 44.3.0 已不含的 `libEGL.so`；ARM64 为 849 通过、1 失败、3 skip，合成 Windows classifier 被正确的 ARM 安全规则拒绝。已修正测试根目录和原生库夹具，按两份官方 ZIP／SHA 建立准确的运行时清单，保留 ELF、执行位、ICD、资源和许可检查。Windows 最新全套 855 项为 854 通过、0 失败、1 项原有 Linux skip。此次新增 Linux 打包校验变化，Windows 产品输入和成品未改变；完整原生重跑仍必需，尚无 Mac／Linux 成品、桌面／游戏或独立三项合格结论。原始失败日志及时间保留，不能改称通过。

本包是多平台移植的接续候选，不是 Mac／Linux／鸿蒙完整验收完成或正式发行的声明。Windows 最新 EXE 与两个 ZIP 已完成干净解压及启动验证；Mac ARM64、Mac Intel、Linux x64／ARM64 的当前原生产物及完整运行证据尚未取得。鸿蒙已生成原生 HAP 接续工程，但缺少官方 SDK、合法签名条件和实机，尚未生成 HAP 或验证游戏。以 CURRENT_STATUS.md、docs/RELEASE-1.1.11.md 和 docs/validation-1.1.11/independent-review.md 为当前权威状态；下方旧版本说明只用于追溯。

Windows x64 使用 _handoff/artifacts/KAMUCL-1.1.11.exe，或解压紧凑 ZIP；无法使用自解压包装器时解压 windows-x64-unpacked ZIP。各附件 SHA256 在 CURRENT_STATUS.md；交接包逐文件清单在 _handoff/manifest.json 与 _handoff/SHA256SUMS.txt。账户、游戏、用户图片、私钥和未提交的 pelican-bicycle.html 不包含在内，接收者自行选择自己的游戏目录和登录。

源码需要 Node.js 22+、npm、Git、完整 JDK 17+。依次运行 npm ci、node scripts/build-bridge.cjs、npx tsc --noEmit、npm test、npm run license:check、npm run build。Mac／Linux 共同 Electron 基线为 44.3.0，必须在对应原生架构上构建；Mac 最低 macOS 13，Linux 目标 Ubuntu 24.04／26.04 LTS。Mac 打包入口 node scripts/pack-mac.mjs <arm64|x64> --package-only；Linux 入口 node scripts/pack-linux.cjs <arm64|x64>。只构建不构成原生功能或一致性通过，详细验收清单见 docs/validation-1.1.11/parity-matrix.json。Mac 当前为 ad-hoc 签名，不是 Developer ID 签名或公证。

鸿蒙入口 npm run prepare:harmonyos、npm run verify:harmonyos、npm run dist:harmonyos；固定运行时、工程来源及缺失条件见 docs/HARMONYOS.md。不可用 SDK／签名／设备条件会报错，界面资源一致性不等于 JVM／LWJGL／游戏启动链通过。

本交接包记录的验证命令是 ["node", "scripts/check-licenses.cjs"]，无需先安装 npm 依赖。先核对外层 SHA256，再核对逐文件摘要并执行该命令；命令成功只验证许可证和对应源码要求。当前新平台正式发布门控要求完整原生运行、游戏、更新回滚、原始画面及独立评分，不能以此轻量命令替代。

2026-10-04 06:05（Asia/Hong_Kong）：GitHub workflow 标准授权已完成，`0d71da0` 已推送 master，main 通过 cherry-pick 同步为 `ef8ec49`，保留独立历史。两次原生 CI 因 FRP／进程就绪测试夹具等待而取消；旧 Windows 更新包夹具也已准确绑定平台，全部原始日志保留。修复后的 853 项 Windows 回归为 852 通过、0 失败、1 项原生 Linux skip；须重新执行完整原生测试和构建。正式标签和 Release 尚未创建，不能从本地包推断存在公开下载。不得强制推送、覆盖 main 独立历史或操作 wuhui。

---

# START HERE — KAMUCL 1.1.10 历史

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
