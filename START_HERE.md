# START HERE — KAMUCL 1.1.18 Windows

本批修复自动 Java 选择、默认材质包选择保存及社区精确前置版本，并增加离线账号本地皮肤应用。仅交付 Windows x64；资源占用优化继续暂停。Electron 保持 44.3.0。

- Project: KAMUCL
- Deliverable: 1.1.18 Windows x64、源码、交接包
- Packaged artifact: _handoff/artifacts/KAMUCL-1.1.18.exe、Windows 紧凑 ZIP、展开 ZIP
- Intended receiver: 使用自己账号和游戏目录的玩家、维护者
- Operating system: Windows 10/11 x64；实际验收 Windows 11 26200、125% 显示缩放
- Runtime/tool versions: Electron 44.3.0、Node.js 24、锁定 npm 依赖、JDK 17+

## Prerequisites

成品运行不需要 Node.js。游戏需要适配 Java 和自己的账号；自动管理按版本下载。离线皮肤首次启动从作者官方来源下载并校验 authlib-injector，已有缓存可断网使用。只承诺自己的本机游戏显示，其他玩家看到的皮肤由服务器决定。

## Setup

源码 ZIP 解压后在项目根执行 npm ci、node scripts/build-bridge.cjs。交接包在 source 目录执行。源码构建需 JDK 17+；本批使用 JDK 25.0.2，并以 --release 8 编译原创离线皮肤提供器。

## Use the deliverable

下载 EXE，或解压紧凑 ZIP 后运行 KAMUCL-1.1.18.exe。展开 ZIP 运行 KAMUCL.exe。用公开 SHA256SUMS.txt 核对文件。成品没有作者账号、登录凭据、个人皮肤、存档或整合包。Windows 发行者签名尚未完成。

社区 MOD 下载确认页检测必要前置、显示关联项目，默认勾选一起下载。来源要求精确前置文件时，不再用其他版本冒充；冲突保持原文件并提示处理。缺少可靠前置信息时不能保证自动定位所有依赖。

“默认配置 → 默认材质包”提供目标实例和“重新应用到此实例”。默认包只用于首次初始化，之后保留游戏内保存的启用、关闭和排序；手动重新应用才覆盖受管理的默认项。旧配置不静默重置。

选择离线账号后在皮肤页选择 64×64 PNG 并应用，或绘制后应用到离线账号；下次启动生效。Classic/Slim、历史恢复、恢复游戏默认皮肤均支持。正在运行的游戏保持启动时快照。

## Verify

开发检查：npm test、npx tsc --noEmit、npm run license:check、npm run build。成品及真实界面命令见 docs/validation-1.1.18/README.md。

交接包记录的验证命令数组是 ["node","source/scripts/check-licenses.cjs"]。在交接根运行 node source/scripts/check-licenses.cjs，应输出 License check passed 并退出 0。此命令只验证许可，不能代替游戏、服务或界面验收。

## 验证范围

1343 项测试：1342 通过、0 失败、1 Linux 专属跳过。类型、许可、构建、包内文件一致性、ZIP 干净解压及冷暖启动通过；四类主题、最小窗口约束和 100%/125% 缩放真实操作通过。

最终 EXE 在 Windows 原生 26.3/Fabric 演示世界显示离线 Slim 皮肤，GPU 纹理对应 PNG 的哈希一致，保存正常退出；游戏内关闭默认材质包后再启动保持关闭。另有 Java 8/17/21/25 官方 authlib 安全纹理解码探针，不能当成四版本完整游戏。

社区依赖和回滚使用合成文件配合生产管线。本批未从两平台真实服务完整安装 MOD 后进入世界；用户原问题实例、完整旧 Forge、全部加载器/MOD 组合、物理 1366×768 主机、完整动效性能及人工听感未覆盖。其他平台未构建。历史失败不改写为通过。

源码来自最终 Git 原始 blob；外部 DELIVERY-1.1.18.json 与 SHA256SUMS.txt 绑定提交、标签及源/交接 ZIP，避免归档自引用。用户数据及未提交 pelican-bicycle.html 不进入归档。
