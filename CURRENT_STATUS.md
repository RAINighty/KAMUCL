# CURRENT STATUS — KAMUCL 1.1.18 Windows

香港更新日志：2026-10-07 14:54。最终验证状态时间：2026-10-07 15:16。Windows x64，Electron 44.3.0。用户图片、收藏、设置、历史计数、旧实例及未提交文件保留；不操作 wuhui，不强推。资源占用优化暂停，本批没有 Mac 成品。

- Project: KAMUCL
- Version or revision: 1.1.18；最终 master 提交由标签及外部 DELIVERY 精确绑定
- Status timestamp: 2026-10-07 15:16 Asia/Hong_Kong
- Build command: npm run build；electron-builder --win portable --x64 --config.electronDist=node_modules/electron/dist --publish never；node scripts/pack-windows-zip.cjs
- Build result: 成功；516 项生产输入在构建前冻结，构建/验收后复核不变
- Test/validation commands: npm test；npx tsc --noEmit；npm run license:check；node scripts/verify-windows-package.cjs；独立实例的真实界面及游戏专项
- Validation results: 1343 项中 1342 通过、0 失败、1 Linux 专属跳过；四主题、原生游戏、构建及包通过；独立分项评分见本版验证目录
- Finished artifact: Windows EXE、紧凑 ZIP、展开 ZIP
- Artifact SHA256: 下表；源/交接 ZIP 在外部 DELIVERY、公开 SHA256SUMS.txt

## Last verified state

| 文件 | 字节 | SHA256 |
| --- | ---: | --- |
| KAMUCL-1.1.18.exe | 97323101 | a0427950efe94c5ffc5f05cca9dcc33b79bab96293cfde7e0c89a2f7198be887 |
| KAMUCL-1.1.18-windows-x64.zip | 97355100 | 630e48cace25ef98a81b7241bd8e38105b2dc281a11089986a9c98c5c5c5c0cc |
| KAMUCL-1.1.18-windows-x64-unpacked.zip | 142987727 | 1ed6eee0cc6ff0d94fd94ff5eda14cadcb9dcb58bf86fe012608fd51fc2732b2 |

## Completed

- 自动 Java 按可信游戏要求选择版本；检查 MOD Java 约束、架构和旧 Forge。诊断与启动使用相同客户端证据；取消不会误杀其他消费者的共享扫描。
- 默认材质包首次初始化后保留游戏内选择、关闭和排序，旧配置不覆盖显式选择。手动目标实例应用带备份、并发保护和失败回滚。
- 离线账号本地 PNG/绘制/历史/重置、Classic/Slim 与账号隔离；原创 Java 8 字节码提供器在游戏 JVM 持有不可变快照并签名纹理，限定本机路由。首次校验下载 authlib-injector，缓存后离线。
- 社区必要前置和项目关联保留；修复 pinned 文件被其他已装版本静默替代。精确哈希不一致或确认期间变化停止写入，保留原文件。
- 1.1.18/根锁/香港分钟日志、原创提供器源码构建脚本与许可说明同步。

## 当前验证

最终 EXE a0427950…be887；证据绑定见 docs/validation-1.1.18。真实界面使用专属配置及前台 HWND/PID 检查，不向其他程序输入。最小窗口请求与 Windows 125% 后的实际 DIP、CSS 小数尺寸分别记录，不伪称严格物理 960×620。

官方元数据/认证库/Java 下载带校验；四 JVM 探针实际解码 PNG。原生游戏为最终 EXE 的 26.3/Fabric 演示世界：实际 GPU 哈希、Slim、存档、两次正常退出和关闭 pack 后再启动保留。社区事务及故障注入使用合成夹具，不冒称两服务的完整真实 MOD 游戏验证。

原始录屏是未经插帧的 compositor JPEG 帧与时间戳，另存原分辨率 PNG；不把采集帧率当成完整动效性能放行。所属启动器主进程退出由实际 child close 记录核对；通用 ownedInventory 的 Windows 清单不可用，不能当作后台进程全清零。

## Remaining

用户原问题实例、完整旧 Forge、所有加载器/MOD 组合、每个 Java 全新网络重下、两服务完整 MOD 安装进入世界、多人显示、物理 1366×768、完整动效性能和人工听感未覆盖。其他平台不在本批。运输和公开身份由外部交付回执核对。

## Known issues and risks

离线皮肤只承诺自己本机，首次网络准备第三方 authlib-injector；加载器/服务器插件可能改变行为。不可变历史纹理暂保留以保护已接受/运行快照，本轮不恢复优化或删除这些文件。EXE 未做发行者签名。

独立评分全部达到 8.5，最低外观 8.6。蓝白主题窄窗待应用卡的选中 Classic 标签对比偏弱，作为非阻断外观问题保留；未宣称零缺陷。

保留历史失败：测试报告半截读取、旧 CSS/共享扫描断言、整数视口误判、过期文案断言、前台窗口干扰、初次游戏 ID 误作 PNG 哈希，以及真实 pinned 错误复用。修复后通过另列；d0dad965 旧候选保存在本地历史，不发布。

通用源归档旧工具仍有 96MiB buffer 与嵌套 out 限制，未作为通过证据。源码使用 Git 原始 blob、逐成员 Git 对象/路径/大小/SHA/隐私检查；交接工具未经修改，明确包含已提交公开夹具，排除实时目录和用户资料。

## Recommended next action

按 START_HERE 干净解压核对 SHA。用自己的账号/目录复验；开发者执行记录的许可命令及相关专项。新增实机覆盖单独补证，不将未测改为通过。
