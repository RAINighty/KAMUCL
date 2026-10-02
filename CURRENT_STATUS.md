# CURRENT STATUS

## Identity

- Project: KAMUCL。
- Version: 1.1.8，基于1.1.7 db54f58。
- Status timestamp: 2026-10-02 15:37（Asia/Hong_Kong）。
- 本批列明范围的实现与功能验证完成；公开发布及附件核对由发行脚本执行。

## Last verified state

629项测试、类型、生产构建、许可证、Windows便携包及三主题GUI、原生双架构Mac APP／DMG及Minecraft26.2功能检查通过。原生录屏benchmark分别记录于发行报告，仍有未达目标项，不能称性能全部通过。固定证据仅来自 Final-Settled-*；Windows最终EXE SHA256：1eae5169245c4c7095cd8ba4fbb46b59e86942ad6c601c7502aae0f97b494c10。七人硬件Stage合并为1次GL绘制，软件环境使用逐像素深度Canvas2D单次上传；504三角面完整保留，几何／UV／法线保持，软件光照为哑光近似。独立视觉／交互逻辑／动效画面评分分别9.0／9.1／9.0。详细实际证据、文件SHA256、覆盖层级和命令见 docs/RELEASE_1.1.8.md。最终源码解压构建和交接复验记录随交接包提供。

## Finished artifact SHA256

| 文件 | 字节数 | SHA256 |
| --- | ---: | --- |
| KAMUCL-1.1.8.exe | 97279794 | `1eae5169245c4c7095cd8ba4fbb46b59e86942ad6c601c7502aae0f97b494c10` |
| KAMUCL-1.1.8-windows-x64.zip | 97311363 | `0c661505fdd3e0317a74716dddf030070c3e8c0c188492da90d6b11f22700713` |
| KAMUCL-1.1.8-windows-x64-unpacked.zip | 143043471 | `bdf6f7b64f03b0c2a8144911ed40db269fa68455a47cc3f2b18b948b409b5c0e` |
| KAMUCL-1.1.8-mac-arm64.dmg | 108654258 | `1599eb47d8065874e0befd43a228942f00a40fbe206172a7506eead388aeae68` |
| KAMUCL-1.1.8-mac-arm64.zip | 100148696 | `72c3d0d62da7471a5652754676702be76e8c9e0097cd6d60750915aba6f9541d` |
| KAMUCL-1.1.8-mac-x64.dmg | 115859912 | `ef5f19bf0e3874b89bcb32b1c0826949ed5a9ec59013864c78d5bed604f6c120` |
| KAMUCL-1.1.8-mac-x64.zip | 106288716 | `2baf9ebcf36234e6f0edefca56a4dab6d3b86e8c1fee72358d99493b07fc8cc2` |

以上为七个已验收成品；源码 ZIP 与交接包包含本文件，摘要记入外部 SHA256SUMS，避免自引用。

## Known boundaries

硬件主观听测、真实微软上传、真实在线收藏模组下载安装未验收；可信CDP走位遮挡端点保持未定。实例图片优先仅源码核对，无专门GUI断言。Mac三主题完整遍历未实跑，Mac无Developer ID签名／公证。小屏模型与调色工具需滚动切换。保留功能的公网NAT、工单等原边界继续保留，不能称本批全部验收已通过。

## Recommended next action

按START_HERE.md核对SHA256并运行成品；后续实际账号、真实在线安装和人工音效听测逐项记录。master／main保留独立历史，不操作wuhui；Release标签与master及附件摘要须以公开远端核对结果为准。
