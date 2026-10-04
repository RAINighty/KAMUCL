# CURRENT STATUS — KAMUCL 1.1.11 接续候选

2026-10-04 15:46（Asia/Hong_Kong）：上述物理归档修复和 Mac 真实目标选择已完成最终冻结检查：984 项，983 通过、0 失败、1 项平台专属跳过，原耗时 174065.1826 ms；类型、许可证、语法及差异格式检查通过。实际 Electron 归档合同记录保留，Windows 本机符号链接 EPERM 的未覆盖范围单列；此合同只证明限定归档边界，不替代 Linux 完整更新交易或原生桌面。新产品成品和全部原生验证仍须按下一提交重构建。


2026-10-04 15:42（Asia/Hong_Kong）：本轮确认并修复 Linux 更新的物理 ASAR 校验与回退备份复制缺陷，实际 Electron 44.3.0 私有合同已验证原缺陷和修复后的归档字节一致；不改全局归档模式。Mac 安装验收改为真实坐标选择联机验证实例，等待对应 1.20.1／Fabric 请求、文件哈希与目标目录一致，兼容性规则和原时限保持不变。完整检查与所有桌面平台重构建尚待本批最终冻结执行，不以旧成品替代新产品提交。

原 b596 原生记录保持原样：Mac 两架构真实 Demo 正常退出和存档通过，Intel WebGL 未通过；Linux 实际窗口控制已通过，更新验收遇到物理归档读取首错。本轮不回填旧失败，未具备完整原生桌面、人工听感及鸿蒙游戏链的证据，不创建正式版本标签或 Release。


2026-10-04 15:10（Asia/Hong_Kong）：最终冻结的公开检查为 979 项，978 通过、0 失败、1 项平台专属跳过，原耗时 164451.6388 ms；类型、许可证与差异格式检查通过。本批仅修正验收和源码归档，不改变产品输入或既有 Windows 成品来源。归档改从 HEAD 的原始 Git blob 生成，明确记录提交及表示格式并拒绝未提交源码和非普通文件；旧 d7 源码包的 247 份 CRLF 工作树差异及严格原字节检查失败单独保留。

Linux d7 三个实际工具服务生命周期已通过；业务验收的逻辑 ASAR 目录错误已精确复现并修正，原 ENOENT 失败不回填。Mac d7 的两架构真实连续点击已通过 32 接受／8 拒绝、接触、音源与计数校验；安装观察器注册包装、诊断写入和恢复边界已修正，独立 17 项合同及 5 项实际表达式故障复核通过，仍需新原生执行。ARM 本轮实际原生采集 719 完整帧／790 回调，全部 SCK 原 FPS 达原门槛；CDP 时间逆序原件仍为不可用于正式时间验收。Intel 实际 WebGL 初始化失败及 GPU Timeout／退出码 255 保持失败。新成品身份与最终交接以此提交后的外部回执为准，所有平台完整资格及三项评分仍未通过。

2026-10-04 14:33（Asia/Hong_Kong）验收收尾：最终公开测试 968 项，967 通过、0 失败、1 项平台专属跳过，原耗时 161446.2582 ms；类型与许可证检查通过。本次仅改验收入口、观察器、测试及状态文档，Windows 产品仍来自 `2d814479b22b8778c80bbbdf8b04421a81cf9c47`。实际四主题和 598 个原始步行帧已独立核对；CDP 采集频率不等同原生呈现帧率，人工听感及完整功能矩阵仍未覆盖。

已实际定位 Electron 44 动态导入 CJS 使旧 Linux 验收入口未执行，以及 Mac 点击后值的微任务过早读取；修正不放宽原条件。工具诊断磁盘故障、超时、迟到的启动与所属进程清理经独立故障注入复核。新的 Mac/Linux 原生结果、最终源码和交接身份由提交后的外部回执绑定；旧结果保持原样，所有平台完整资格仍为 false。下方 13:36 及更早内容为各自时点记录。

2026-10-04 13:36（Asia/Hong_Kong）接续验证：新增公共产品与原生适配已冻结，版本保持尚未正式发布的 1.1.11。当前工作树完整公开检查 `npm test` 为 949 项：948 通过、0 失败、1 项 Linux 专属 shell 在 Windows 跳过，原耗时 162260.3472 ms；`npx tsc --noEmit`、`npm run license:check` 与差异格式检查均通过。固定 280 接口、63 功能、481 子断言的协议专项 83 项通过；独立复核确认布尔宣告包装与矛盾 SCK 帧状态被拒绝，真实布尔返回类型保留。协议夹具不能证明原生功能或平滑动作。

本轮修复 Linux 陶瓦服务的独立临时目录与所属进程退出、账号页真实凭据安全提示、卡慕接受／拒绝点击的同步观察值，以及固定鸿蒙十个模板的关闭交接与持久目录授权。鸿蒙旧授权恢复失败可见重试，损坏记录保留原值后重新授权；普通文件不扩大授权。Mac 新验证覆盖四主题、240 个真实坐标页面场景、队列、离线账号与设置重启、真实公开 Modrinth 下载。Linux 新验证覆盖当前官方联机二进制、架构、私有服务、后端状态、三类更新包交易与所属 X11 窗口。相关实现与实际覆盖边界见 `docs/validation-1.1.11/CONTINUATION.md`。

Windows 生产构建、ASAR／运行时检查及三份包已生成；本机全局构建缓存问题的失败和中止日志保留，使用本批独立 Electron 下载缓存后完成，未改运行时版本或关闭哈希检查。EXE 为 97184460 字节、SHA256 `4bcb9a3d8a218963d091f8bd116419a229442e4a7de4009419a6618ce70eb604`；紧凑 ZIP 为 97216031 字节、SHA256 `a2a4c432cdd2b9c0f22a430f5def62258531272e623604493bd9195c907ee849`；直接解压 ZIP 为 142973034 字节、SHA256 `d538a4708d60e9d256fa310017997c470df4c0b438c6d1ec6d4c92e6abb8157c`。真实 GUI、便携包干净启动及新的 Mac／Linux 原生结果以提交后的外部回执为准，未预填通过。原 99e0ef4 的 14 份成品已逐摘要备份至 `release/history-99e0ef4/`；其原始证据、失败及交接包保持不变。

本轮首次全量为 932 项：930 通过、1 失败、1 跳过；非法步长已正确拒绝，失败原因是测试对隐式错误文字的匹配，条件不变并补明确错误提示后重跑上述 949 项。两张静态图交替或任意自造 manifest 仍不能凭协议摘要证明真实采集或动作顺滑；可信实际采集器和独立观看是必要条件，不能把合成正例称为原生通过。

所有平台完整资格仍为 false，视觉／交互／动效评分均未完成，没有 v1.1.11 正式标签或 Release。用户已明确没有真实 Intel Mac；Ubuntu 两架构 GNOME／KDE／XWayland 全部桌面证据尚缺。鸿蒙缺官方 SDK、合法签名、电脑及尚未完成的原生 JVM／JNI／GLFW／音频游戏链。新公共产品修改要求重新构建各桌面平台，旧包不能绑定新提交。当前源码提交、远端同步、最终成品与交接包身份将在本轮外部回执准确绑定，以下各轮记录为历史快照。

2026-10-04 09:02（Asia/Hong_Kong）当前快照：第六轮精确绑定已推送 master `69c1e89ba23a007535c77bae65052f19b6d87f58`；main `bb41072b907d8ade365e9beadc4a71ee7e69a6ca` 经 cherry-pick 保留独立历史。Mac run [37163779043](https://github.com/kamubaba-i/KAMUCL/actions/runs/37163779043) 和 Linux run [37163779037](https://github.com/kamubaba-i/KAMUCL/actions/runs/37163779037) 已结束，均不构成完整平台合格或正式发行。版本仍为 1.1.11，本批不再修改 03:59 的内置更新日志或递增版本。

Mac 两架构各 864 项为 860 通过、0 失败、4 项既有平台 skip；15 个任务中 12 成功、3 个正式 UI 失败。成功任务为 2 个打包、2 个实际 Demo 游戏、6 个限定集成、ARM DMG 的限定四主题 GUI 和 1 个独立 Intel GPU 诊断。ARM DMG 的实际可见皮肤步行、焦点和受管壁纸均通过；ARM APP 的原始 CDP 90 帧在第 55→56 帧倒退 1.618 ms，原算术 FPS 60.53927763443197、formalTimingUsable=false，保持失败。Intel APP／DMG 实际 WebGL 初始化仍失败；独立诊断收集成功也仍无画布，不能把它当产品修复。第六四个 Mac 成品实际内嵌文件为 Contents/Resources/kamucl-mac.json，sourceCommit、Electron 44.3.0、架构、最低 macOS 13 和签名均有实际核对；旧摘要的 kamucl-build.json 计划名在 summary.json 的 historicalSnapshotErrors 保留。

Linux 两架构各 864 项为 861 通过、0 失败、3 skip；六个 AppImage／DEB／tar.gz 原生包的干净解压、ELF、执行位、摘要及内嵌 source69／实际 Electron 44.3.0 身份通过。三次 Xvfb 已启动实际应用，均在 ANGLE／Mesa llvmpipe 的 WebGL 创建失败后触发 skin canvas missing，原失败和时间保留，finalizer 没有再遮蔽首错。软件驱动 blocklist 是强线索，最终根因仍待同一进程 GPU 状态诊断；不能宣称 Vulkan 驱动缺失。没有 Ubuntu 24／26 两架构的真实 GNOME／KDE／XWayland 硬件桌面主机或完整验收。

本批第七完整本机公开测试为 874 项：873 通过、0 失败、1 项 Linux 原生 shell skip，duration=117970.8989 ms，TypeScript 通过。这覆盖原冻结的 QA／合同测试；全套之后追加的 Mac 原生 BGRA 证据收集修订另经针对性校验，不能笼统称全部最终 QA 都在 874 项之前冻结。它们不能替代 Mac／Linux 原生执行。本批黑橙 general refinement 实际 GUI 已通过，包含最小窗口、1.25／1.5 缩放、最大化与原报告中的有限交互；当前黑橙 ux110 可见步行／外观另在执行，尚不预填通过。四主题 final3 可见模型／步行／壁纸仍为上一 source69 已验证结果。新 Mac SCK 与 Linux 同进程 GPU 观察器尚未原生运行，源7提交 SHA=null、nativeRunsStarted=false；Windows 产品输入未改，不因 QA／文档重包装。所有平台完整资格 false、三项评分 null、无正式 Release。

全部平台 completeQualification=false，视觉／交互／动效分别为 null；没有 v1.1.11 正式标签或公开 Release。第六源码／旧交接的build/icon.png 与 build/icon-512.png 两个构建图标漏收已由独立审计记录，下一交接按根文档与完整 source prefix 闭包核对，不能以旧包运输验证冒充源码闭包完成。第五轮旧世界 SHA 缺失继续保留；第六真实正常退出后的新 Demo 世界 SHA 单独记录，不补造旧世界。用户图片、设置、收藏、历史计数、私有账号／世界／整合包和未提交文件保留，不纳入公开包。以下旧快照只描述各自记录时点。

2026-10-04 08:02（Asia/Hong_Kong）第五轮历史快照：第五轮绑定已推送提交 `5167500`，Mac run `37160588297` 和 Linux run `37160588146` 均已结束。Mac 两架构各 857 项为 853 通过、0 失败、4 项既有平台 skip；2 个打包、2 个实际 Demo 游戏和 6 个限定集成任务成功，4 个 APP／DMG UI 任务失败。Linux 两架构各 857 项为 854 通过、0 失败、3 skip，六个三格式包的原生干净解压与包检查通过；三次 Xvfb 预检因缺少 `xdpyinfo` 失败，随后 finalizer 的 `scandir out ENOENT` 遮蔽首错，应用未启动。这是 QA 前置失败，不能算应用失败或桌面通过。

本批已冻结 QA 和包装身份修订，Windows 产品构建输入无变化。Windows 最新全套为 864 项：863 通过、0 失败、1 项 Linux 原生 shell skip，TypeScript 通过；四主题最新 final3 实际 GUI 的可见模型、原帧时间、真实像素变化、焦点及受管壁纸解码断言通过，仍属限定本机回归。Mac／Linux 新内嵌 sourceCommit／runtimeVersion 身份必须在本次提交后的新原生构建中验证，目前尚未重建。本批源码 SHA 和 Delivery 外部回执须在提交后更新，不能给第五轮旧包绑定未来提交。全部平台完整资格仍为 false，视觉／交互／动效评分均为 null；没有 v1.1.11 正式标签或 Release。

2026-10-04 07:04（Asia/Hong_Kong）更新：第四轮候选 `e0b1210` 原生 CI 均结束。Mac `37158774374` 两架构各 855 项为 851 通过、0 失败、4 项既有系统 skip；两个打包及六个限定集成任务成功，4 个 UI 和 2 个游戏任务失败。双架构 ZIP／DMG 已实际生成，Electron 44.3.0、最低 macOS 13、ad-hoc 签名明确记录；不代表完整一致性通过。ARM UI 缺独立输出目录、游戏任务依赖跨任务窗口探针属于 QA 前置问题，已修正。Intel 原截图、30 个无画布样本及三轮 EGL／GPU 错误确认 3D 初始化真实失败，根因仍需原进程诊断。Linux `37158774429` x64 为 852 通过、0 失败、3 skip，三格式实际生成后因 builder 文件名映射失败；ARM64 为 851 通过、1 失败、3 skip，打包跳过。已改为精确命名和私有目录独占发布，取消夹具使用真实未完成传输门控，保留原时间线。最新 Windows 全套 857 项为 856 通过、0 失败、1 项原有 Linux skip；最终 tar 发布调用另经语法及 4 项专项复验。此次产品输入及 Windows 成品未变，QA／Linux 包装变化必须原生重跑。独立修正复核通过，但所有平台完整门控及三项评分仍未完成；没有正式标签或 Release。

2026-10-04 06:30（Asia/Hong_Kong）更新：第三轮 `2b1e6f1` 的 Mac run `37157548139` 与 Linux run `37157548122` 均完整结束为 failure，没有取消或死锁。Mac 两架构各 853 项为 846 通过、3 失败、4 项既有系统限定 skip；失败为测试临时目录别名 `/var` 与产品正确返回的 `/private/var` 规范路径不同。Linux x64 为 850 通过、0 失败、3 skip 后进入生产构建，但旧打包检查要求官方 Electron 44.3.0 已不含的 `libEGL.so`；ARM64 为 849 通过、1 失败、3 skip，合成 Windows classifier 被正确的 ARM 安全规则拒绝。已修正测试根目录和原生库夹具，按两份官方 ZIP／SHA 建立准确的运行时清单，保留 ELF、执行位、ICD、资源和许可检查。Windows 最新全套 855 项为 854 通过、0 失败、1 项原有 Linux skip。此次新增 Linux 打包校验变化，Windows 产品输入和成品未改变；完整原生重跑仍必需，尚无 Mac／Linux 成品、桌面／游戏或独立三项合格结论。原始失败日志及时间保留，不能改称通过。

## Previous verified snapshot

2026-10-04 06:05（Asia/Hong_Kong）。当前版本 1.1.11；公开基线为 1.1.10。修复 FRP、POSIX 进程就绪等待与 Windows 更新夹具后的全量公开测试 853 项：852 通过、0 失败、1 项 Linux 原生 shell 测试在 Windows 跳过；TypeScript 通过。初始下载与取消阶段分别观测，五个平台／架构使用隔离夹具执行真实控制器；独立真实子进程观测保留 stdout、正常退出码和仅自建进程终止断言，四个平台／架构更新路由保留目标隔离与记录清理断言。这些合成／局部平台分支验证不能替代原生运行。此前生产构建、许可证、Windows EXE／两 ZIP 干净解压、冷／热启动及完整 payload／ASAR 核对通过。本次后续变更仅测试、工作流和状态文档，全部 Windows 产品构建输入及成品摘要未改变。四主题 ux110 与黑橙的彩蛋、皮肤、色板、图片／收藏、导入和选择必测模块通过；服务夹具与故障注入不作为真实在线服务证据。

## Completed

已实现共享平台信息和架构规则、Linux 安全凭据与会话回退、ARM64 原生库与 ELF 验证、联机资产、X11 游戏窗口助手、按安装形式选择附件和 Linux 更新回滚、Mac 44.3.0／13+ 两架构构建与完整验收入口。修复旧版本测试分流，建立 15 页面／280 IPC／63 场景矩阵和读取原始证据的发布门控。鸿蒙固定原生运行时／模板，生成接续工程并验证共享前端字节一致；不宣称 HAP 或游戏运行通过。

## Remaining

第六 source69 的 Mac 四包和 Linux 六包已完成原生生成、真实内嵌提交／运行时身份和限定包检查。ARM DMG 四主题可见步行与壁纸通过，ARM APP 原 CDP 时间逆序和 Intel APP／DMG WebGL 缺失仍失败；Linux 三次 Xvfb 的实际应用也在 llvmpipe 上失败。当前第七 QA 的原生采集／GPU 状态观察尚未原生验证。所有页面、真实账号／联机／更新和完整矩阵尚未完成，三项独立评分均未给出。鸿蒙缺 SDK、合法签名、设备和完整 JVM／LWJGL／JNI 游戏链。

GitHub workflow 标准授权已完成，第六 master `69c1e89ba23a007535c77bae65052f19b6d87f58` 与 main `bb41072b907d8ade365e9beadc4a71ee7e69a6ca` 已实际推送，main 为 cherry-pick 独立历史。当前第七 QA／文档批次尚未提交，其 sourceCommit=null，提交后再写外部源码／Delivery 回执。首次和第二次 FRP／POSIX 夹具等待取消、旧 Windows 更新夹具误路由，以及第三至第六轮原日志和失败逐轮保留，不改称通过。此前 OAuth 权限拒绝、超时和过期授权记录仍是历史；没有 v1.1.11 标签或公开 Release，不操作 wuhui。

## Known issues and risks

历史 Intel 活动停顿与 CDP／SCK 未达标继续失败；第六 Intel APP／DMG 当前 WebGL 初始化仍未解决。ARM APP 90 个原帧的 55→56 时间倒退 1.618 ms，算术 FPS 60.53927763443197 不能使其原时序可用；不排序或重写帧时间。ARM DMG 的独立四主题可见步行通过不填补 APP 失败。Linux AppImage 缺少 FUSE／提取运行不自动替换；DEB 交系统安装器确认不等于自动更新完成；系统模糊与外部窗口控制仍受合成器及 X11／XWayland 能力限制。安全凭据、会话回退和 ARM 原生库拒绝规则保持。

物理听感、全部真实账号与社区服务、跨架构真实联机及完整矩阵未覆盖。Mac 仍为 ad-hoc 签名，不是 Developer ID 或公证；第五轮旧世界逐字节 SHA 缺失不可补造，第六 Demo 正常退出后的新世界 SHA 有独立收据。第六源码／旧交接漏收build/icon.png 与 build/icon-512.png 两个构建图标的历史审计保留，下一源码／交接包必须核对完整构建输入闭包。详见本轮 summary、Mac／Linux 说明和独立评审。

## Recommended next action

本机第七完整套件与 TypeScript 已通过；确认全套之后追加的原生证据收集针对性校验与当前黑橙 ux110 结果，再提交并重新执行 Mac／Linux 原生验收；以实际 PID 校验后的 Linux GPU 状态和 Mac SCK 原始 BGRA／PTS／完整采集状态分析失败，不更改正式帧率／时序门槛。补充 Ubuntu 24／26 两架构真实桌面／GPU主机，以及 Mac 支持 GPU／最低版本实机。提供合法鸿蒙 SDK、签名与设备后继续游戏链。各平台全部必测通过且视觉、交互、动效分别至少 9 分、无关键缺陷后才能发布，不用 Xvfb／交叉构建／局部 Windows 回归代替。

## Packaged artifact SHA256

以下为本地 Windows 接续候选，未公开发布。

| 成品 | 字节数 | SHA256 |
| --- | ---: | --- |
| KAMUCL-1.1.11.exe | 97290244 | dd584c92935c71ebdcd5ca379d0f1f851c9a07b604a9dcdfd6f2a1986e8142c7 |
| KAMUCL-1.1.11-windows-x64.zip | 97321815 | 78d31f0045102c983fa67d586511993312f2901c686b3f75be1d0f95c163bd2f |
| KAMUCL-1.1.11-windows-x64-unpacked.zip | 143058234 | 676162091dc723ee97ee6309232eca01de24d0fe602ddaa3d2e71d702b2dd881 |

内嵌 ASAR SHA256：b03fe16bb64a0bb341069db58b736e3aaeffb8866495f45f1bc4c82dcc64b5f1。最终源码提交由 SOURCE-MANIFEST.json、源码审计回执和交接包清单绑定。完成最新应用构建后的改动仅涉及 QA、发布门控和文档；干净源码审计再次核对提交后的文件。全部用户图片、账号、收藏、计数和未提交的 pelican-bicycle.html 保留在原位置，不包含在成品或公开源码。

## Changed files and evidence

入口为 START_HERE.md。源码文件列表由源码清单给出；本批验证汇总 docs/validation-1.1.11/summary.json，逐项库存 parity-matrix.json，独立评审 independent-review.md。原始测试／构建／包验证／GUI 记录保存在交接包 release/validation-1.1.11/；原始帧不插帧、不重写时间。记录验证命令 ["node", "scripts/check-licenses.cjs"]，成功仅表示许可证／对应源码核对，不是全平台验收。

---

# CURRENT STATUS — KAMUCL 1.1.10 历史

## Last verified state

2026-10-03 14:43，788/788 测试、TypeScript、生产构建、许可证及最终 EXE 四主题 GUI 已通过。产品成品 SHA256 如下。成品之后的文档与 QA 脚本变更不改变应用构建输入。

## Completed

收藏真实图标与旧记录补图、黑紫玻璃透明度、闲置 LOGO 永久暂停皮肤修复、自然站姿和回调保护、启动减少动态效果诊断、启动卡随机播放。原生启动当前显示器 59.96 FPS，备用启动两种动态模式已验证。详见 docs/RELEASE-1.1.10.md。

## Remaining

本文件写入时，Windows 最终 EXE/ZIP 干净解压与完整哈希检查已通过；源码和交接包运输核对以及远端提交、标签、公开 Release 与附件核对仍在执行；由交付回执确认结果，不由文件描述推断完成。

## Known issues and risks

受影响用户电脑不可访问；真实 CDN/平台图标网络未覆盖（服务夹具与真实图片解码分别记录），物理声音未复听，Mac 两架构暂停，录屏帧时间未改写或当作所有机器的 FPS 合格证明。历史失败保留，详见 summary.json。

## Recommended next action

从 GitHub v1.1.10 核对 SHA256 和 Windows 下载，源码运行 START_HERE.md 的验证；系统关闭动画时在 Windows 辅助功能 → 视觉效果开启动画。继续 Mac 工作须由用户恢复范围。

## Packaged artifact SHA256

- KAMUCL-1.1.10.exe: 92e93260179b75f36d3e145ad70f7c4e818042d6de60fadf3949a372249b50da
- KAMUCL-1.1.10-windows-x64.zip: 76cfb0eebf917a639b6551b0d360c47ddc71850239799a303430dce1fca95442
- KAMUCL-1.1.10-windows-x64-unpacked.zip: d1b42165dedeed4d32f53559da120af90fd083001959deb63f23013bb2a5edd7

## Changed files and evidence

应用更改覆盖收藏模型/项目元数据/收藏 UI，App 玻璃与彩蛋优先级，SkinViewer3D 帧生命周期，原生启动诊断，轮播类型/策略/状态/UI，设置说明及版本锁文件。验证入口 tests/appearance-motion-110.test.ts 和 scripts/verify-appearance-motion-110-ui.cjs；完整文件列表由源码和交接清单给出。

---

以下保留 1.1.9 历史文档，仅用于追溯，不是当前验收或安装说明。

# CURRENT STATUS — KAMUCL 1.1.9

## Last verified state

Windows 成品、三主题与真实 PCL 导入已验证；783 项测试、许可证检查及源码干净解压构建通过。实际成品仍来自 07a1d87c，最终文档与发布工具没有改变应用构建输入。

## Completed

皮肤编辑、主题勾选和安装弹窗、LOGO 单人卡慕及整合包优先分类已完成。独立 Windows 评分为视觉 9.0、交互 9.1、动效 9.0。完整证据、成品摘要及服务／夹具边界见下文。

## Remaining

最终源码包和交接包需与本次文档修订提交重新绑定，并完成运输复验、GitHub 公开 Release 和远端附件核对；这些步骤以发行回执为准，不由本地验收推断完成。Intel 和 Apple Silicon Mac 按用户要求暂停。

## Known issues and risks

物理音效听感、微软真实上传和社区真实在线安装未覆盖。暂停前 Intel 动效停顿及低于目标的原始结果未解决；Mac 不属于本轮合格或交付范围。完整历史失败与未覆盖项见下文。

## Recommended next action

接收者先核对 GitHub v1.1.9 的标签、SHA256SUMS.txt 和附件，再按 START_HERE.md 解压、核对逐文件摘要并运行记录的许可证检查。接续 Mac 工作前须获得用户恢复该范围的指令，保留原始失败与帧时间。

状态时间：2026-10-03 11:01（Asia/Hong_Kong）。

本轮仅交付 Windows。产品提交 07a1d87c0710ab070b763172d27dcf7cebd6547b；EXE SHA256 11a8f16142a0f40519adb2203a91ee7bf74b2ab35ef456729e5034a8fc0aafef；renderer index-rFSz7oqx.js；Windows 实际 GUI QA 07a1d87c0710ab070b763172d27dcf7cebd6547b。暂停前 Mac 历史 QA／源码桥接 a8496bf81efc1f815dc89b7a3e078f8b6ed89b74、CI 37087543778 不作为 Windows 实测 QA 或全球合格结论。Windows production07a1d87c and its real GUI/PCL/portable validation remain unchanged. Subsequent QA/source a8496bf product inputs are identical. User explicitly deferred both Mac architectures; Windows-only release asset selection and delivery documentation do not change app build inputs. Original Windows GUI QA07 and PCL QA0a exact source receipts remain separately bound to the current07 executable; Mac results are historical and never Windows or global qualification.

皮肤编辑器采用模板布局并固定关闭／保存操作；勾选、半选和安装弹窗统一主题。LOGO 原位卡慕单人逐次排队拍打，保留其余六人的历史计数。统一 import:probe 优先识别整合包清单，修复 PCL 包夹带存档时的误分类；用户图片、设置、收藏、原始包和现有实例继续保留。

实际日志 out/test-119-windows-only-release-final.log：783/783 通过，失败／跳过／取消／未实现测试项均为零，耗时 75722.0961 ms。Windows 范围独立评审 complete／passed：视觉 9、交互 9.1、动效 9 各自达到 9，当前 Windows 关键缺陷为零；不使用平均分或推断填分。

当前附加许可日志 out/licenses-119-windows-only-release-final.log 已通过，SHA256 d2fc75c204b8379dc900667285519f9edf35d111740b03a309f6c42645ebd43e。

Windows 黑橙／浅色／自定义三主题完整记录逐文件哈希相符。用户明确暂停 Intel／Apple Silicon Mac 的开发、构建、验收与安装包输出。本轮不运行 Mac 验收，不输出 Mac 成品，Mac 未合格；Windows 评分不替代其动效验收。

暂停前 Mac 历史：release/validation-1.1.9/Delivery/History/native-a849-deferred-original-intel-formal-stall/evidence.json（SHA256 29d23e9549eb2b19b37058d78aa9837478e917541b164d1fee6d78f349be0fcc）；macQualificationAccepted=false。原 Intel 活动 PTS 间隔 130.62733300000673 ms、声源间隔 168.20000000006985／165／198.09999999997672／163.29999999993015／328.70000000006985／246.59999999997672／164.59999999997672／195.59999999997672／170.30000000004657 ms 保留，正式 CDP／SCK below-target false 与独立动效拒收未改为通过。原成功 job 为功能结果，不能代替动效合格；根因未确定。Mac work and installers deferred by the user. Previously collected a849 native jobs succeeded functionally; Intel formal APP original active PTS gap130.627333ms and below-target formal/SCK false remain unresolved and are not accepted. These results do not gate or claim Windows-only UI qualification.

皮肤保存状态补验分别读取四次可信单点事件、真实 UV／RGBA 差异和两个原始 PNG；基础层保持 255、外层保存 128 透明度，重复绘制与吸色实际差异为零。每个保存同时要求原 IPC 返回 true、渲染器已保存且忙碌／冻结解除；未将 IPC 返回单独当作完成。实际保存处理器均恢复。Windows 补验清单 SHA256 b373fedfab401ae2dc5062b50f483e1103ad61b1fdd7d5baa05a57c076ae6050，16 个原文件已逐项核对；独立记录不替代原三主题完整验证，也不推断历史 Intel 失败原因。

Windows 黑橙独立补验：release/validation-1.1.9/Delivery/Palette-State-Observation-Windows-download304/skin-palette-state-119-black-orange.json（SHA256 722a7575ce17441975864b5935210f0aadc9d94f70404dd7935ec9caf24c3439）；两次实际就绪 321 ms／PNG SHA256 8a8033e08fc638439b050c37e301f7e01dc110d277eeb0ef381315c5d5a26db1、317 ms／PNG SHA256 9931814687c2179da9c3372d5fd33b77b91768d478cc8677ae8423a94e902354。

已存在的额外截图／缩放记录按原清单复验：release/validation-1.1.9/Delivery/Skin-State-Observation-Windows-download304（35 个原文件；清单 SHA256 1fda8d42be47f0810ae35fa360113241a2d8b84d3f7130d66eb8a4488c33bd3d）；release/validation-1.1.9/Delivery/Feedback-Scale-download304/black-orange（443 个原文件；清单 SHA256 6a211f1feeff4072d30bdb01b4f84e9a4e16b9d48c10fd1d866874bfd5d6d04e）；release/validation-1.1.9/Delivery/Feedback-Scale-download304/blue-white（443 个原文件；清单 SHA256 2b2f7d1e93b1954f1e33f3b87cdf8a59d9e2924dfdd01afa8fd855bebe50cdc4）；release/validation-1.1.9/Delivery/Feedback-Scale-download304/custom（445 个原文件；清单 SHA256 64afd46b3d863cd3bf6ef6498d39ae0d254d5179c8ead2af40042d0e284d2863）。这些记录的功能、评分和原始 benchmark 保持分开。

独立生产窗口生命周期补验 release/validation-1.1.9/Delivery/Active-Production-Lifecycle-Windows-download304/kamu-active-production-lifecycle-119-black-orange.json（SHA256 f4e4a41b3b9e0dfc254bd18f898b351090b0234299b1a8bd5211a208e43289b9），原始 receipt SHA256 5d1985847d76173827ae9d9f3c21f4889004af709a438f26e25879dc325ad28d、log SHA256 92ed81beb0c4860e994b6e373dedd993175621a22f4f2ec57f8317cd232e83f2。其 product／EXE／QA、四个原始 QA 源快照和清单逐字节核对，未复用历史 df8 结果。实际 backgroundThrottling=true，关闭焦点模拟并移除三项禁用后台节流参数；原生最小化时 document.hidden=true，实测暂停 258.09389999999985 ms，动画时间、音源开始数、计数、队列和画布上传不动。恢复后六个可信拍打对应加六和六个独立真实掌击声源；第二次真实活动掌击期间关闭彩蛋，18 项效果取消、两个 AudioContext 原调用返回 closed、两个实际 WebGL2 上下文报告 lost，原 renderer／main hooks 均恢复。这里只验证彩蛋 stage 关闭，没有推断整个窗口销毁、GC、正常帧率或耳机／扬声器听感。

当前精确 EXE 的安全 PCL 证明为真实服务验证后的隔离缓存复用（fixtureTransport=false、realServices=true），不是新冷 CDN 下载。46 模组／4 材质包／2 光影包／1 存档；50 清单 SHA1／SHA512 和 325 overrides 字节一致，原用户包未变。实际 Windows Minecraft 1.20.1／Forge 47.4.23 主菜单窗口 PNG 已按 SHA256 核对；没有打开私有世界。社区收藏、逐个安装与失败恢复使用受控 metadataFixture，committed:false 的记录仅是安装计划，不能描述成真实在线下载写入。

## 三个 Windows 成品 SHA256

| 成品 | 字节数 | SHA256 |
| --- | ---: | --- |
| KAMUCL-1.1.9.exe | 97282718 | 11a8f16142a0f40519adb2203a91ee7bf74b2ab35ef456729e5034a8fc0aafef |
| KAMUCL-1.1.9-windows-x64.zip | 97314287 | d71d0173ed7d3cabb92b70b77f08f773385c25d4f613d984a07c6a3a1d91149c |
| KAMUCL-1.1.9-windows-x64-unpacked.zip | 143047398 | c33f492fc66054991cf8d8f904df2ffc477904e8e4e828d44e3c5901dea11c30 |

## 历史失败与未覆盖

历史 416 Intel APP 的 480000 ms UI 超时和原始 298.0389595031738 ms 活动延迟完整保留，该次未完成后续 DMG／游戏。c101 后续实际 APP／DMG／Minecraft 核心均通过，额外更新被 25 分钟总作业期限取消，不能改写成游戏失败。其 APP 掌 170.0739860534668 ms、DMG 掌 202.5442123413086 ms、转身 293.9188480377197 ms 当时为动效 8.5 的拒收缺陷。原采集 false／below-target、冷头像 478.9009094238281 ms 等待、帧／时间／声源均保持原值；不插帧、不平均或放宽 nominal30／实际显示频率和 90 ms 音源门槛。

be684（CI 37040518710）ARM APP 完成，DMG 的 skin makeDirty 失败，后续游戏／工具／更新被跳过；原因未证实。Intel 当次 APP／DMG／游戏／工具／更新完成，但正常 CDP APP／DMG 原始 28.823869368236103／29.16257666775738 fps 均为 status=below-target、passed=false。后来新观测通过不能反推该旧失败已得到因果修复。原 Candidate：release/validation-1.1.9/Delivery/History/native-be684-recorder-partial/CANDIDATE.json（SHA256 64ab7897e9c17599cfb131e27827030069ef688edaf76e548a73e990dabdc9ea）。

ad217（CI 37046206273）两架构 APP／DMG／游戏／工具／更新功能完成。4 条日志仅报告 ARM SCK APP／DMG passed、Intel below-target；因阶段环境变量遗漏，四项原始 BGRA、PTS／status JSON、PNG 和 receipt 未归档，独立原生视频属于未覆盖，不能从日志重建或验收。正常 CDP 原值为 arm64 app 59.94766591464087 fps / true、arm64 dmg 60.02177665884168 fps / true、x64 app 28.786189379478277 fps / false、x64 dmg 28.080961413285365 fps / false，其中 Intel false 完整保留。原 Candidate：release/validation-1.1.9/Delivery/History/native-ad217-video-collection-gap/CANDIDATE.json（SHA256 82aba82ad49cd49c6e63b76a26f3e562fa45cc3e1b8a951563386e811261460a）。

38296（CI 37049091272）两架构 APP／DMG／游戏／工具／更新功能及四项 SCK 原始采集完成；2026-10-03 03:10 独立全局评分仍为 9／9／8.5，未合格。Intel APP 活动掌击原帧 30→33 的 PTS 间隔为 131.81587899998704 ms（约 131.815879 ms），callback 间隔 137.903734 ms；中间 31／32 为原始非完整 status=1，没有补成图像帧。这是实际活动呈现延迟，不能只解释为静止同像素采集抑制。与此独立，Intel SCK 全程 APP／DMG 原始 24.814276859672987／29.105916860429957 fps 的 whole benchmark 均为 false；正常 CDP APP／DMG 25.279447778570155／29.176427377942996 fps 也仍为 false。ARM 局部动效 9 和功能完成不抵消 Intel 缺陷；新产品的备用帧调度也不反推历史失败已治愈。原 Candidate：release/validation-1.1.9/Delivery/History/native-38296-foreground-cadence-failure/CANDIDATE.json（SHA256 90a2ed8058450286d80e14abda95fffcf0d502bf1965e93c2c162939eea2ed0b）。

f7b9070（CI 37054137475）为加入备用帧调度后的共享新产品历史。ARM APP／DMG／游戏／工具／更新完成，原两个 ARM 成品仅保留外部 SHA 引用。Intel APP 在第四个 1440×684／1.5 紧凑布局的头部显隐 aria-pressed=true、预期 false 断言失败，后续 DMG／游戏／工具／更新跳过；Intel 两个成品未产出，原因尚未证实。本次三项独立 SCK 采集及逐字节 BGRA→PNG 核对完成，不能把 Intel 全 APP 改为通过。Intel SCK whole 26.150901109769062 fps 原始 passed=false，active 29.938328603795487 fps 与 whole 分别记录，正常 CDP 27.993230370645446 fps 原始 false 保留。实际 watchdog 样本保留 null RAF 时间；40 ms 备用定时器不能跨越阻塞 JavaScript 的 143 ms 长任务。原注入 no-backdrop 145.39999999996508 ms 和恢复 backdrop 95.39999999996508 ms 保留为诊断，不用它们或后续 1b42 观测反推本次修复或合格。只读分析未提供评分；重复／idle／PTS／未知丢帧保持原值。原 Candidate：release/validation-1.1.9/Delivery/History/native-f7b9070-watchdog-part-toggle-failure/CANDIDATE.json（SHA256 d00f1955bdc24aa04f45eef23d5e7ab2f30b6c711fc9390008996394d77a6d9d）。

1b42（CI 37056101196）为同 f7 产品的后续 QA 历史。ARM APP／DMG／游戏／工具／更新完成；Intel 五种皮肤布局各单次可信点击后头部隐藏，未复现旧 f7 显隐断言，但不倒推旧失败原因。随后重复半透明像素 clean 断言 actual=false／expected=true 失败，并出现退出 ETIMEDOUT，DMG／游戏／工具／更新及两 Intel 成品缺失。之前 outer alpha=128 断言已执行，原 palette-opacity PNG、绘制 UV／RGBA、保存结算状态和失败截图未归档，不能补造或给出原因结论。Intel header 23.757291518740544 fps 和 SCK whole 26.824209424779546 fps 的原始 false 保留；active 29.996424561658944 fps 低于原 30，分别记录。正式 SCK 活动最大原 PTS 间隔 36.83803900003113 ms，无 watchdog；cold first-native 的 16 个 watchdog 仍伴随 late timer 和 95.40000000002328 ms 活动延迟，after-header 99.5 ms 保留为诊断，回调来源不等于因果治愈或合格。后续保存结算与 UV／RGBA 观察复测未纳入，未提供评分。原 Candidate：release/validation-1.1.9/Delivery/History/native-1b42-palette-clean-assertion-failure/CANDIDATE.json（SHA256 ae6bf1879120801810317a050db487fd4ac23d9b18c3af05bf2a64659b344548）。

5be338d（CI 37059909531）继续使用 f7 产品，仅增加 QA 观察。两架构 APP／DMG 及新调色板原始可信 UV／RGBA、两次保存结算和原 PNG 均完成，不能倒推旧 f7／1b42 失败原因。ARM 游戏／工具／更新完整；Intel 实际日志已进入测试世界，随后 screencapture -x -D 1 返回 exit 1、could not create image from display 25165824，属于实际截图失败而非超时。其最终 verification、原存档／区域和正常关闭检查未完成；保存日志不能替代磁盘验证。Intel 工具／更新独立完成，四个原 Mac 成品按 SUMS 核对后仅留外部 SHA 引用。Intel header 原始 28.995708575449907／28.692595207239854 fps 均为 false；SCK whole 23.74567382434487／27.61504013395236 fps 原始 false 保留，active 26.25578514636929／30.00698242476522 fps 分别记录，只有 DMG active 达标不能替代 whole。APP 原活动帧 51→53 间隔 99.68214199989234 ms，中间 52 为 idle；DMG 40→41 间隔 37.33113999987836 ms。真实 RAF／watchdog、原始 PTS／status、逐像素 BGRA／PNG 和未知丢帧边界保持原值，未提供分数或推断因果治愈。原 Candidate：release/validation-1.1.9/Delivery/History/native-5be338d-game-capture-failure/CANDIDATE.json（SHA256 048b4937a34ca433fe58eda27477c9d14ae4620af1b20ff951e0ba4bf1d9ea17）。

df8c7ee CI37067073503 attempt1：ARM 功能、游戏、工具与更新完成；Intel APP／DMG、实际 Minecraft 与工具完成，25分钟作业期限取消时更新未完成，capture-state.complete=false、inhibitor.released=false 原样保留。它没有满足最终采集收尾门控，不能当作一次全绿。Intel 正常 CDP 27.256736241485495／29.066234101110993 fps、SCK whole 28.36494070620574／27.391204323099952 fps 原始 false 保留。原 Candidate：release/validation-1.1.9/Delivery/History/native-df8c7ee-palm-compositor-deadline-cancelled/CANDIDATE.json（SHA256 4b7a4407a41f676ef30228d2e3c4b5745c3ee49479b11a587dd29f565b88db08）。

同头 df8 attempt2，精确 Intel artifact11255172163／job111052908196：APP／DMG 功能、调色板与原始 SCK 全字节核对完成，但真实 Minecraft 资源安装收到 HTTP304，游戏尚未启动；capture-state.complete=false、captureCount=0，抑制器最终 released=true。工具与更新独立完成，不能拼接 attempt1 游戏通过而声称此次成功。原 artifact ZIP SHA256 ef3b752685da2cf1b7e89e4e09fd870100b32165576ade8f6ada1c5f36551e1f 与官方 digest 一致；正常 CDP 29.676458271655054／28.384082438956497 fps、SCK whole 26.663502528570735／27.619654621285928 fps 均保留 false，active 分别为 29.98475345549518／27.789268051985044 fps。原 Candidate：release/validation-1.1.9/Delivery/History/native-df8c7ee-palm-compositor-http304-failure/CANDIDATE.json（SHA256 01c991bb2148970da7df5deaf0d64094e534401c2db9c584cf25a9d02c1070ca）。

Windows 独立 lifecycle 首次原 run exit1：原生最小化成功，document.hidden=false／visibilityState=visible，等待实际隐藏暂停的断言失败；两个原 hook cleanup=true。原失败清单 release/validation-1.1.9/Delivery/History/Active-Lifecycle-Windows-palm-compositor-failure-20261002T223918465Z/evidence.json（SHA256 6dcecc310971c4041a2409005b8aa1e96d591eafa033828e5ce142127a4c5119）保留。随后 df8 production-window 独立原 run exit0 在关闭焦点模拟并移除三项禁用后台节流参数后，观察到 backgroundThrottling=true、真实文档隐藏，暂停 258.4445000000014 ms、六计数及六独立掌击源、两个 AudioContext closed 和两个 WebGL2 lost。原 proof release/validation-1.1.9/Delivery/Active-Production-Lifecycle-Windows-palm-compositor/kamu-active-production-lifecycle-119-black-orange.json（SHA256 f36de1a75f7d86d3b0898237044daf553498fe0c05ac8582463b76ee79fbce92）。两次实际运行条件不同，后一次不能抹除首次失败或作为新产品免测依据；stage close 不代表整个窗口销毁、GC、主观听感或帧率验收。首次 PCL 参数遗漏日志另外按测试启动基础设施失败保存，导入器当时未运行。

0297b12 CI37076690205：ARM APP／DMG 功能与采集通过，正常 CDP 原值 57.966754564804／60.23482452170352 fps；ARM 游戏、工具及更新的原成功记录单独保留。Intel job111068069746／artifact11257351229 在“successful upload refreshes profile”断言失败，尚未完成 APP 后续、DMG、游戏及工具验收；当次没有充分上传状态观测，原因仍未确立，不能用后来 QA 发现回填为已证实原因。该 run 总体 failure；ARM 成功不能补齐 Intel。两架构官方 ZIP、源 Git blob、原日志及所有安全成员的 SHA／大小／文件闭包已核对。原清单 release/validation-1.1.9/Delivery/History/native-0297b12-download304-arm-success-intel-upload-failure/evidence.json（SHA256 0b676b12832a2d34c409b1177962c205363c6758532512adaad2937cceffa399）。

0a7ff72 CI37079281681：ARM／Intel 均在“upload QA observers/handlers must be restored”断言失败。原夹具失败与成功上传状态均 ready=true，监听器已移除且原 busy listeners 保留，但两个原 IPC handler identity=false；原项目 handle 注册包装与夹具重新注册原 handler 再次包裹相吻合，QA 还原缺陷已确立。此为隔离夹具验证，未验证真实 Microsoft 上传服务；两平台后续完整 APP／DMG、游戏及工具未覆盖，不能借 0297 ARM 成功拼接。Intel 独立 observer ABA 在减少动态效果模式执行正常手掌可见断言，原 65 个样本均 reduced，手掌透明度0／动画为空、手印正常淡出，10次计数与10个真实声源守恒；该诊断仍 complete=false。SCK whole 原值 24.18409687240473 fps／原门槛 29.43021583557129，原 passed=false 保留，active 30.025562958352772 fps 不替代 whole。两架构官方 artifact/source/log 身份与全部安全成员已核对。原清单 release/validation-1.1.9/Delivery/History/native-0a7ff72-upload-qa-restoration-aba-failure/evidence.json（SHA256 d16fefb806d44f3f5cdc9d75bddcc41ec8408784965bfdf8d4840861ca9c6be8）。

e81ddc7 CI37080988726：ARM job111081241919 与 Intel job111081241732 原结论均 success，APP／DMG 功能、实际游戏、工具与更新的作业成功不改写为失败。独立评审拒收该候选：Intel visual9／interaction9.1／motion8.5，Windows 与 ARM 原分数分别保留，不平均、不用正式采集或诊断B抵消原始A。正常 ARM CDP 60.22155321151912／59.28990924304912 fps 与 SCK whole 57.4999999999986／56.42857142857235 fps 原 passed=true；Intel CDP 29.680599324439076／29.249667689740264 fps、SCK whole 26.01303154825863／27.37552248580128 fps 原 passed=false。六个独立 observer ABA case 功能 complete=true、每项10真实声源／计数／保存与正面结束；六项原 wholeFPS=false仍保留，不替代正式 baseline。clocks-A-original 完整原帧44→45 131.00935700003902ms、46→49 136.11220999996476ms，47／48原 idle 无伪造像素；源间隔324.9／262.6ms附近真实停顿未覆盖为通过。四帧 BGRA／PNG 全RGBA、六sidecar原PTS／status、官方ZIP／源Git blob／原日志与8787个安全成员SHA／大小／闭包已核对。额外时钟探针、67ms长任务、宿主或产品合成路径的因果仍未确立；B较快不是修复证明，物理听感和真实Microsoft上传等未覆盖项保留。原冻结清单 release/validation-1.1.9/Delivery/History/native-e81ddc7-job-success-independent-intel-motion-rejection/evidence.json（SHA256 32fd38f74973190f166caa4d09f81fc33ed2abe9597ab43d0d58618790f3d284）；宽scope完整评审仅引用原size／SHA，精简公共评审与14个原失败BGRA／PNG／JSON完整保留。

历史完整原始证据：KAMUCL-1.1.9-validation-history-part001.zip、KAMUCL-1.1.9-validation-history-part002.zip、KAMUCL-1.1.9-validation-history-part003.zip、KAMUCL-1.1.9-validation-history-part004.zip、KAMUCL-1.1.9-validation-history-part005.zip，共 5 卷，每卷小于 2 GB；索引 KAMUCL-1.1.9-validation-history-index.json（SHA256 9284b34bda62cdce1b14b9fda11953b3326c201df4e174ca2a4b34fd2141fca4）。已核对当前 155056 个成员、原字节与分卷摘要，保留干净解压回执。临时浏览器 profile／缓存仅在公开排除记录中列明；原 out 与真实用户数据未删改。

仍未覆盖：物理扬声器／耳机的实际掌击听感及爆音感知，真实 Microsoft 登录／皮肤上传，社区两平台真实在线收藏安装，Mac 实际用户 PCL 包或私有存档游玩，公网 NAT、长期稳定性、磁盘耗尽、全部缩放与无中键设备实物验证，Developer ID 签名／公证。数字峰值与声源检查不替代听感。Mac 本轮工作和输出暂停，未声明任何 Mac 合格；实例专属图片优先主要依据源码／测试。

本文只记录经门控的本地验收；源码／handoff 干净构建与运输复验、外层 SHA256、远端 master／main、精确标签及公开附件核对由发行步骤另行确认，不提前宣称发布成功。main 保留独立历史，通过 cherry-pick 同步，不操作 wuhui。
