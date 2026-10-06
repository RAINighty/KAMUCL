# START HERE — KAMUCL 1.1.17 Windows

本批完成用户文档中的11项界面与功能修正，发布Windows x64。Mac不在本批范围；资源占用优化已撤回。Electron仍为44.3.0，素材、GPU和现有功能保留。

- Project: KAMUCL
- Deliverable: 1.1.17 Windows x64、完整源码及交接包
- Packaged artifact: artifacts/KAMUCL-1.1.17.exe、紧凑ZIP、展开ZIP
- Intended receiver: 使用自己的账号和游戏目录的玩家，以及后续开发维护者
- Operating system: Windows 10/11 x64；本批不包含Mac成品
- Runtime/tool versions: Electron 44.3.0、Node.js 24、npm锁定依赖、JDK 17+

## Prerequisites

运行成品不需要安装Node.js；游戏需要相应Java运行环境和自己的账号。源码开发需要上述Node.js、JDK及Windows构建工具，具体依赖以锁文件为准。

## Setup

交接包完整解压后，在source目录执行npm ci、node scripts/build-bridge.cjs；源码ZIP直接在解压项目目录执行。不能把账号、私钥或个人存档加入源码。

## Use the deliverable

下载本版EXE或紧凑ZIP，解压后运行KAMUCL-1.1.17.exe；展开ZIP运行KAMUCL.exe。用公开SHA256SUMS.txt核对附件，使用自己的账号和游戏目录。成品及源码不包含发送者账号、登录凭据、用户图片、存档、整合包或反馈文档。

全新配置默认使用AppData/Roaming/.minecraft；现有.kamucl和自定义目录保留，不迁移或删除旧实例。“设置 → 游戏设置 → 游戏窗口 → 退出游戏自动保存窗口化大小”默认关闭，开启后从下一次启动起记录该游戏的正常窗口尺寸，仅正常退出提交；实例已有分配规则继续生效。

皮肤页新增下蹲/飞行，历史皮肤可直接预览；预览不会上传，也可在未登录状态使用。社区中文MOD查询会核对MC百科公开关联的来源项目；未关联或接口受限不会猜测下载项目。MOD预下载/校验与安装分别显示任务进度和取消、重试，不把准备完成描述为已安装。

## Verify

开发需要Node.js24、锁定npm依赖及JDK17+；执行npm ci、node scripts/build-bridge.cjs、npm test、npx tsc --noEmit、npm run license:check、npm run build。Windows打包脚本和精确界面验证入口见source/docs/validation-1.1.17/README.md（独立源码ZIP为docs/validation-1.1.17/）。

交接包可携带验证命令数组为 ["node","source/scripts/check-licenses.cjs"]；在交接根目录运行 node source/scripts/check-licenses.cjs，应输出License check passed并退出0。此命令只验证许可，不能代替真实游戏、账号、网络或动效验收。

## 验证范围

全量1284项：1283通过、0失败、1Linux专属跳过；类型、许可、生产构建及Windows包验证通过。最终四主题实际界面、原始帧/操作、落盘和独立评分见本版验证文档。真实官方服务证据仅中文查询元数据；MOD文件下载、必要前置、哈希、取消、失败恢复和事务落盘采用本地合成夹具配合原生产管线。

本批未实际运行Minecraft进入世界，未取得用户原0.0.0实例或真人窗口退出复现；窗口读取用真实专属Win32子进程验证，产品会话/提交采用夹具。物理1366×768主机、完整动效性能基准和人工听感未覆盖。Windows未做发行者签名。历史失败原件保留，不回填通过；以前各版记录见docs/validation-1.1.16及更早目录。最终远端提交、标签和源码/交接身份由外部DELIVERY-1.1.17.json及Release回执记录，避免归档自引用。
