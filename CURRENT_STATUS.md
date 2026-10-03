# CURRENT STATUS — KAMUCL 1.1.11 接续候选

## Last verified state

2026-10-04 04:55（Asia/Hong_Kong）。当前版本 1.1.11；公开基线为 1.1.10。最终公开测试 843 项：842 通过、0 失败、1 项 Linux 原生 shell 测试在 Windows 跳过。TypeScript、生产构建、许可证、Windows EXE／两 ZIP 干净解压、冷／热启动及完整 payload／ASAR 核对通过。四主题 ux110 与黑橙的彩蛋、皮肤、色板、图片／收藏、导入和选择必测模块通过；服务夹具与故障注入不作为真实在线服务证据。

## Completed

已实现共享平台信息和架构规则、Linux 安全凭据与会话回退、ARM64 原生库与 ELF 验证、联机资产、X11 游戏窗口助手、按安装形式选择附件和 Linux 更新回滚、Mac 44.3.0／13+ 两架构构建与完整验收入口。修复旧版本测试分流，建立 15 页面／280 IPC／63 场景矩阵和读取原始证据的发布门控。鸿蒙固定原生运行时／模板，生成接续工程并验证共享前端字节一致；不宣称 HAP 或游戏运行通过。

## Remaining

Mac ARM64／Intel 和 Ubuntu 24.04／26.04 x64／ARM64 原生打包、安装、所有页面与真实游戏／联机／更新验收尚未完成。独立评审已核对有限 Windows 截图和原始录屏，但各平台视觉、交互、动效仍未评分，完整功能通过项不能由局部 GUI 回归填充。鸿蒙缺少 SDK、合法签名与设备，尚无 HAP 或 JVM／LWJGL／JNI 游戏运行链。

候选 master 提交尚未成功推送：GitHub 实际拒绝新增工作流，OAuth 仅含 repo／read:org／gist，缺少 workflow。三次标准授权未成功完成，前两次直接连接超时、代理重试到期；旧基线仍在远端。main 的独立历史须以 cherry-pick 接续；没有 v1.1.11 标签或公开 Release。本地源码／交接包的最终 SHA、干净解压和验证命令由外部回执记录，不能用本说明推断已经发布。

## Known issues and risks

历史 Intel 活动停顿与 CDP／SCK 低于门槛仍保持失败，尚无当前实机复测。Linux 提取运行的 AppImage／缺少 FUSE 不自动替换；DEB 更新需要系统安装器确认；桌面模糊和外部窗口控制受合成器及 X11／XWayland 能力限制。拒绝不安全凭据持久化；缺少系统密钥服务时仅会话登录。仅 x64 游戏或模组原生库不能冒充 ARM64 兼容。

物理音效听感、全部真实账号与社区服务、跨架构真实联机及完整功能矩阵未覆盖。当前 Mac 包计划 ad-hoc 签名，不是 Developer ID 签名或公证；当前鸿蒙运行时完整第三方许可证与签名条件尚未满足。所有历史失败与当前未覆盖项见 docs/RELEASE-1.1.11.md、mac-acceptance.md、Linux 接续说明和独立评审。

## Recommended next action

先恢复 GitHub CLI 的 workflow 标准授权，再推送当前候选并在对应原生架构执行构建。提供 Ubuntu 实际桌面／GPU 与正式系统组合，按矩阵补齐逐项运行和原始画面；取得合法鸿蒙 SDK、签名及实机后继续原生游戏链。只有各平台全部必测通过且三个独立评分各至少 9、无关键缺陷，才发布合格附件。不可把 Xvfb／交叉构建／Windows 回归视为对应平台通过。

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
