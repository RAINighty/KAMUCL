# START HERE — KAMUCL 1.1.19 Windows

本批修复皮肤外层透明吸色导致后续画笔不可见，并补齐 MRPACK 导入入口、带 BOM 清单和重复目标检查。仅交付 Windows x64；Electron 保持 44.3.0，资源占用优化继续暂停。

- Project: KAMUCL
- Deliverable: 1.1.19 Windows x64、源码、交接包
- Packaged artifact: _handoff/artifacts/KAMUCL-1.1.19.exe、Windows 紧凑 ZIP、展开 ZIP
- Intended receiver: 使用自己账号及游戏目录的玩家、维护者
- Operating system: Windows 10/11 x64；本批实际 Windows 11、125% 系统显示缩放
- Runtime/tool versions: Electron 44.3.0、Node.js 24、锁定 npm 依赖、JDK 17+

## Prerequisites

成品不需要 Node.js。游戏需要自己的账号、适配 Java 及游戏资源。Windows 构建需要可用的 .NET Framework C# 编译器及 JDK，本批使用 JDK 25.0.2。网络下载使用官方和对应资源服务；接收者自行提供账号，不附带作者凭据。

## Setup

源码解压后在项目根执行 npm ci、node scripts/build-bridge.cjs；交接包在 source 目录执行。成品直接运行，无需安装源码工具。

## Use the deliverable

直接运行 EXE，或解压紧凑 ZIP 后运行 KAMUCL-1.1.19.exe。展开 ZIP 运行 KAMUCL.exe。核对公开 SHA256SUMS.txt。成品不包含作者玩家账号、登录凭据、用户皮肤、存档或整合包；Windows 发行者签名尚未完成。

绘制皮肤选择“外层（可透明）”。吸取空白透明像素会保留原画笔；已有半透明颜色正常采样。若历史画笔透明度是 0%，可点击“恢复不透明（100%）”。基础层仍不透明，保存、关闭确认及手势保持原行为。

.mrpack/.MRPACK 可通过顶部导入或拖入首页、模组、资源包、光影、默认配置页导入为整合包。保留原有 Modrinth、CurseForge、完整客户端和嵌套包识别；普通资源 ZIP/JAR 在资源页仍按本页原规则处理。识别到损坏整合包不静默改当存档；MRPACK 别名重复目标在下载写入前拒绝。

## Verify

开发检查：npm test、npx --no-install tsc --noEmit、npm run license:check、npm run build。Windows 包检查：node scripts/verify-windows-package.cjs。真实界面命令、原始证据与范围见 docs/validation-1.1.19/README.md。

交接包记录的验证命令数组是 ["node","source/scripts/check-licenses.cjs"]。在交接根运行 node source/scripts/check-licenses.cjs，应输出 License check passed 并退出 0。此命令只验证许可，不代替界面、整合包或游戏验收。

1356 项测试：1355 通过、0 失败、1 Linux 专属跳过。生产构建、类型、许可、成品包内一致性、ZIP 干净解压和冷暖启动通过。四主题实际小窗口、1280×900/125% 界面缩放下外层绘制、PNG 导出重读、MRPACK 入口通过；原有关闭意图、保存忙碌与失败回归通过。

MRPACK 下载校验、覆盖目录和安装落盘使用小型合成包与本地 HTTP 服务，基础运行安装用夹具；不是完整第三方在线包进入游戏的证据。文件选择框只将目标路径固定到合成文件，生产导入/PNG 写入不替换。全部皮肤面、所有 DPI、实体触控笔、人工听感、完整动效帧率、其他平台和所有游戏加载器组合未覆盖。

源 ZIP 使用最终 Git 原始 blob；外部 DELIVERY-1.1.19.json 与 SHA256SUMS.txt 绑定最终提交、标签和源码/交接 ZIP，避免自引用。用户数据和未提交 pelican-bicycle.html 不进入归档。
