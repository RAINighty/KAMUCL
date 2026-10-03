# KAMUCL 1.1.11 Linux 接续构建、安装与验收边界

记录时间：2026-10-04 04:44（本地时间，Asia/Hong_Kong）。

本轮目标为 Ubuntu 24.04 LTS、26.04 LTS 的 x64 与 ARM64，复用当前共享功能、界面与动作实现。**四种组合均尚无当前候选的原生构建、真实桌面及游戏验收通过记录，不能据此文档宣称功能、外观或动效已经完全一致。**

本地候选提交为 `6f5aecd`，还有后续收尾改动待提交。GitHub 实际拒绝了本次 master 推送，原因是 OAuth 授权缺少 `workflow` 范围；候选尚未推送，Linux 工作流尚未在本轮候选上运行。接续时须先解决授权、形成最终候选，再核对远端提交与构建来源。本文没有执行推送、触发工作流或发布。

## 当前证据

| 环境 | 当前原生构建 | 当前真实桌面、游戏与完整验收 |
| --- | --- | --- |
| Ubuntu 24.04 x64 | 未执行 | 未执行 |
| Ubuntu 24.04 ARM64 | 未执行 | 未执行 |
| Ubuntu 26.04 x64 | 未执行 | 未执行 |
| Ubuntu 26.04 ARM64 | 未执行 | 未执行 |

Linux 专项测试在当前 Windows 开发机上为 7 项通过、1 项跳过，类型检查通过。通过项覆盖凭据保护、ELF 架构、TAR 路径与完整性、包身份和 AppImage 安全拒绝；跳过项是在 Linux 真正运行更新 shell、交换文件与失败恢复的回归。它们不证明 Linux GUI、密钥服务、系统安装器、游戏或帧率已通过。

已加入的入口与验证器：

- [原生打包](../scripts/pack-linux.cjs)：当前架构编译与打包，不用另一架构的运行库拼包。
- [运行库检查](../scripts/verify-linux-runtime.cjs)：ELF、执行权限、游戏窗口助手、Java 桥、ASAR 与隐私文件边界。
- [包检查](../scripts/verify-linux-package.cjs)：三种包干净解压、逐文件 SHA256 和执行位核对、源提交与架构绑定。
- [桌面验证](../scripts/verify-linux-desktop.cjs)：真实桌面与夹具 smoke 分开记录，保留原始视频和时间；报告仍列出未覆盖项。
- [Linux 工作流](../.github/workflows/linux-build.yml)：Ubuntu 24.04 两架构原生打包；24.04 两架构及 26.04 x64 的 Xvfb smoke；四种真实桌面组合须另有对应自托管机器。

## 接续原生构建

在对应架构的 Ubuntu 上使用 Node.js 24、npm 与 JDK 17。JDK 用于编译随包 Java 桥；实际游戏所需 Java 版本由启动器另行选择或下载，并须核对真实架构。以 Node `process.arch` 为准：x64 对应 Debian 包的 `amd64`，ARM64 对应 `arm64`。x64 包和 ARM64 包必须分别原生构建。

以下命令为接续人员在独立工作目录执行的步骤，本轮尚未执行。先检出最终候选并记录完整提交 SHA，安装构建依赖：

```sh
sudo apt-get update
sudo apt-get install -y build-essential libx11-dev squashfs-tools libfuse2t64
node --version
node -p process.arch
java -version
git rev-parse HEAD
npm ci
npm test
npx tsc --noEmit
npm run license:check
node scripts/build-bridge.cjs
node scripts/verify-bridge-exit.cjs
npm run dist:linux
```

`dist:linux` 会构建 Java 桥、编译 Linux X11 窗口助手、完成生产构建，再生成当前架构的以下文件，并调用包验证器：

| 文件 | 用途 |
| --- | --- |
| `KAMUCL-1.1.11-linux-x64.AppImage` 或 `…-arm64.AppImage` | 单文件 AppImage |
| `KAMUCL-1.1.11-linux-x64.deb` 或 `…-arm64.deb` | 系统安装包；内部架构为 amd64／arm64 |
| `KAMUCL-1.1.11-linux-x64.tar.gz` 或 `…-arm64.tar.gz` | 用户目录便携包，根目录为 KAMUCL |
| `SHA256SUMS-linux-x64.txt` 或 `SHA256SUMS-linux-arm64.txt` | 三种成品的 SHA256 |
| `linux-proof-架构-packages/summary.json` | 源提交、架构、包大小、SHA256 与解压检查结果 |

输出在 `release/`。构建器保留完整 Electron 运行库和资源；AppImage 使用项目自己的 [AppRun](../scripts/linux-AppRun.sh)，不自动关闭 Chromium sandbox。最终发布还须核对成品与最终提交一致，不能把补改前的包绑定补改后的提交。

## 安装与启动

以下示例仅适用于后续得到且已校验的成品，并不是现有公开下载地址。先检查架构，再与交付的 SHA256 文件核对；不要将 x64 包安装到 ARM64 主机。只下载一种包时可以用 `--ignore-missing` 跳过其他未下载的包，但所使用包必须实际出现并校验成功。

```sh
taskArch="$(node -p process.arch)"
sha256sum -c "SHA256SUMS-linux-${taskArch}.txt" --ignore-missing
```

### DEB：推荐的系统安装路径

使用桌面系统安装器打开 DEB 并确认安装，或由用户明确执行：

```sh
sudo apt install "./KAMUCL-1.1.11-linux-${taskArch}.deb"
```

APT 会解析包的依赖；不能把 `dpkg-deb -x` 的解包结果当作完成系统安装。当前打包依赖的 electron-builder 安装脚本会处理桌面入口、sandbox 权限，并在系统支持时安装当前应用的 AppArmor userns profile；这些路径与安装结果仍需在实际 Ubuntu 24／26 主机验证。

应用作为普通用户从桌面入口或 `kamucl` 启动。不要以 root 身份运行 GUI。系统安装器所需权限由用户确认，启动器不会静默提权或直接写入 `/usr`、`/opt`。

### AppImage：正常 FUSE 启动与手动提取

正常挂载启动需要 FUSE2 兼容库和可用的 `/dev/fuse`。Ubuntu 24／26 使用包名 `libfuse2t64`；更新前读取内嵌包身份还需要 `squashfs-tools` 提供 `unsquashfs`。FUSE3 不能代替本成品要求的 FUSE2 兼容库。相关背景见 [AppImage 官方 FUSE 说明](https://docs.appimage.org/user-guide/troubleshooting/fuse.html)。

```sh
sudo apt install libfuse2t64 squashfs-tools
chmod +x "KAMUCL-1.1.11-linux-${taskArch}.AppImage"
"./KAMUCL-1.1.11-linux-${taskArch}.AppImage"
```

缺少 FUSE 时，AppImage 的手动提取路径仍保留，可在独立用户目录尝试：

```sh
"./KAMUCL-1.1.11-linux-${taskArch}.AppImage" --appimage-extract
./squashfs-root/AppRun
```

也可使用 AppImage runtime 的 `--appimage-extract-and-run`。提取只解决文件系统挂载问题，不会绕过 GTK、图形驱动或 Chromium sandbox 的系统要求；当前候选尚未对这些运行路径进行原生验收。

**从解压模式运行的 AppImage，或 FUSE 不可用的环境，会拒绝受控 AppImage 自动替换。** 原程序与已下载包保留，用户可以手动安装 DEB、提取新包，或改用便携 tar.gz。此限制避免 extract-and-run 的外层进程退出后，真正的 Electron 仍运行，导致恢复时出现新旧实例同时运行。显式提取后的目录运行也不能据此承诺已通过自动更新及备份回退验收。

### tar.gz：用户目录便携运行

在独立且可写的目录保留整个 KAMUCL 文件夹：

```sh
tar -xzf "KAMUCL-1.1.11-linux-${taskArch}.tar.gz"
./KAMUCL/kamucl
```

保留资源文件、目录结构与执行权限。FAT／特殊挂载的 `noexec` 策略或人为去掉执行位可能阻止启动；更新时会在替换前检查执行权限。便携目录放入 `/usr` 或 `/opt` 会按系统安装路径处理，接续验收使用独立用户目录。

## 桌面依赖与安全限制

Ubuntu Desktop 通常已具备多数图形与音频库。对于精简桌面，当前候选的图形 smoke 使用 GTK3、NSS、Xss、ALSA、GBM、X11 和 D-Bus；用户目录包仍依赖主机库。可据缺失库诊断安装：

```sh
sudo apt install libgtk-3-0t64 libnss3 libxss1 libasound2t64 libgbm1 libx11-6 libxtst6 libnotify4 libsecret-1-0 xdg-utils
```

上述包名按 Ubuntu 24／26 的 t64 命名使用；其他发行版的包名、ABI、桌面策略与系统安装方式未纳入本轮认证。GTK3 包可查 [Ubuntu 26.04 官方包页](https://packages.ubuntu.com/resolute/libgtk-3-0t64)，ALSA 包可查 [Ubuntu 24.04 官方包页](https://packages.ubuntu.com/noble/libasound2t64)。仅安装共享库不等于已具备图形桌面、D-Bus 会话、音频设备或有效 GPU。

应用和游戏窗口控制以 X11 或 Wayland 会话中的 XWayland 为当前基线。需要实际可用的 `DISPLAY`；纯 Wayland、禁用 XWayland或管理员强制覆盖为纯 Wayland 的情况未获完整支持结论。窗口助手只匹配本次游戏 PID，发送正常关闭消息并观测焦点，不通过强杀游戏模拟正常保存。关闭启动器后游戏继续运行、游戏正常保存及焦点交接仍须实机验证。

Ubuntu 24／26 具有 AppArmor 对非特权 user namespace 的限制；浏览器 sandbox 使用该能力，未获应用 profile 允许的便携包可能因此被系统阻止。KAMUCL 的 AppRun 和桌面入口**不自动添加 `--no-sandbox`，也不为用户关闭全局 AppArmor 或 userns 限制**。优先使用正常 DEB 安装及每应用策略，并保存真实系统错误。相关机制见 [Ubuntu AppArmor 文档](https://documentation.ubuntu.com/security/security-features/privilege-restriction/apparmor/) 与 [Ubuntu 支持版本安全功能表](https://documentation.ubuntu.com/security/security-features/security-features-tables/)。

工作流的 Xvfb smoke 只在一次性 GitHub hosted VM 中暂时调整 userns 限制，Chromium sandbox 仍保留。该配置不能复制成用户安装要求，也不能拿它替代默认安全策略下的真实桌面验收。

## 更新、凭据与数据保留

DEB 的更新流程下载并校验对应架构包，再在后续启动交给系统安装器。打开安装器成功只代表 `awaiting-system-confirmation`，**不代表自动更新完成**；用户取消、安装失败、系统没有 DEB handler 或仍运行旧版本都必须准确报告，原下载包保留。完成与否需核对系统安装结果及新版本实际启动。

正常 FUSE AppImage 与用户目录 tar.gz 更新使用对应安装形式的官方资产，核对大小、SHA256、版本及架构后才进入替换。更新助手等待原启动器退出；启动确认超时后只操作受控启动器 PID 与 starttime，待新启动器退出才恢复原应用，不停止游戏进程组。Linux 上的真实更新、超时恢复、取消及异常退出仍未完成验收。

账户令牌只允许受保护的 GNOME libsecret 或 KWallet 后端持久化。没有有效系统密钥服务、密钥服务锁定或后端为 `basic_text`／未知时，新登录令牌仅用于本次会话；已有密文保留。应使用正常桌面 D-Bus 会话并启用、解锁 GNOME Keyring 或 KWallet，再验证登录与重启恢复。联网工单的不可重复所有权密钥无法安全保存时会拒绝提交。机制背景见 [Electron safeStorage 文档](https://www.electronjs.org/docs/latest/api/safe-storage)。

成品只包含应用资源与依赖，不包含玩家账户、图片、收藏、设置、人物计数、游戏目录、私有整合包或存档。Linux 常规用户数据位置由 Electron 的 `app.getPath('userData')` 决定，通常在 `~/.config/kamucl`；环境配置可改变位置，应以当前应用报告为准。接续验收始终用独立测试 profile 和游戏目录，保留原用户目录及未提交文件；`pelican-bicycle.html` 不属于本轮交付。

## 接续验收与发布条件

在 Linux 原生桌面准备 Node.js 24、`mesa-utils`、`x11-utils` 与带 X11 采集能力的 `ffmpeg`，先完成并保留当前提交的包验证结果，再执行：

```sh
node scripts/verify-linux-desktop.cjs "${taskArch}"
```

验证器拒绝 root、Xvfb／Xvnc／Xephyr 和 llvmpipe／SwiftShader 等软件渲染器作为真实桌面证据。它会运行当前共享 GUI 模块，覆盖四主题、皮肤／彩蛋、图片／收藏与导入选择等操作，保留原始桌面录像和帧时间。录屏的请求采样率不等于产品已达到目标帧率，低帧率、真实停顿和失败记录不得改写为通过。

GitHub hosted 的 `--fixture-smoke` 单独标记 `nativeDesktop:false`。真实桌面作业需要对应架构及 OS 标签的专用自托管 runner；`desktop_qa` 默认关闭。Ubuntu 26.04 ARM64 没有被本工作流的 hosted smoke 覆盖，必须在真正 ARM64 的 26.04 桌面补证。

尚须补齐的必测证据：

1. 四种 OS／架构组合的原生构建、三类成品干净解压、实际安装与启动、SHA256 和最终源提交。
2. 默认 AppArmor／userns 策略下 DEB 安装、FUSE AppImage 与提取路径；GTK、XWayland、密钥服务和音频环境。
3. 完整皮肤编辑手势、PNG 导出重读、所有关闭意图、失败恢复及真实账号登录后重启。
4. LOGO 动作与计数、键盘焦点、隐藏恢复、资源释放、原始帧率与实际声音听感；独立视觉／交互／动效评分各自达到 9／10。
5. 真实 Minecraft 下载、当前架构 Java 与 natives、世界启动及磁盘存档、正常关窗、关闭启动器后游戏继续。
6. 社区两平台真实服务、用户私有 PCL 包在隔离目录的完整导入与实际游玩、Sakura／Terracotta 与真实远端连接。
7. 正式可信资产的更新、DEB 系统确认、拒绝篡改、失败恢复、重启持久化及无同时运行的新旧实例。

当前桌面验证器也显式保留其中若干未覆盖项；单个脚本 `complete:true` 不会自行成为完整平台合格证明。发布前由最终截图、原始录屏、测试记录和独立评审汇总形成同一提交、同一成品的验收记录，再通过 [平台发布门槛](../scripts/platform-release-gate.cjs)。授权与原生证据尚未补齐时，保留候选和成品状态，准确报告未完成环节。
