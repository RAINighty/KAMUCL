# CURRENT STATUS

## 交付状态

- 项目：KAMUCL，版本 1.1.6。
- 本地时间：2026-10-02 01:52。
- 应用实现：f5ae0fe；原生 Mac 完整验证：d5f93ee。最终对应源码以 v1.1.6 标签为准。
- 本批六项功能完成；master 与 main 保持独立历史，逐批 cherry-pick 同步。

## 实际验证

- npm test：560 / 560，通过，无跳过。
- npx tsc --noEmit、npm run build、node scripts/check-licenses.cjs：通过。
- Windows EXE、中文路径 ZIP 解压、冷/热启动及全部运行文件：通过。
- 深色 black-orange、浅色 blue-white、自定义主题的全页面 GUI、尺寸和缩放回归：通过。
- 皮肤旧 PNG、正/背/侧面及外层、两种手臂模型、身体/腿部 UV、导出 PNG 和小窗口：通过。
- 真实 Windows 普通权限内存整理及重复操作合并：通过，包含拒绝访问的实际统计。
- Mac arm64 / x64 原生 APP 和 DMG、公共功能 GUI、实际 Minecraft 26.2、保存退出：通过。
- Mac 启动碎片、鼠标反馈、减少动态效果、工具下载、更新与回退：通过。
- VoxLink 上游临时私有房间标准 TURN 和旧 TURN 各传输 5000 字节并校验 SHA256，释放后退出。
- 干净源码解压后 npm ci、JDK 17 桥接重建、生产构建和类型检查：通过。字节一致性没有作为重建承诺。

证据：docs/validation-1.1.6/windows.json、mac.json、voxlink-live.json；Mac CI 运行 36900960198。

## 功能与重要文件

皮肤、投影、模组收藏、七人互动、Windows 内存整理的入口及边界见 docs/FEATURES_1.1.6.md。
VoxLink 的固定上游版本、逐值常量、协议适配和未覆盖项见 docs/VOXLINK_AUDIT_1.1.6.md。
START_HERE.md 给出完整 JDK、Node、构建、验证及成品使用方法。

## 未覆盖与限制

真实微软皮肤上传、真实工单附件提交、公网对称 NAT 和跨 Java 客户端仍需实际参与者验收。
未验证所有投影 MOD 的游戏内加载、未来 26.x、所有收藏项目依赖组合、Windows 启动前整理的真实游戏全过程、
每种受保护进程和每个平台的新功能窄窗口组合。模拟服务、回环协议和实际网络证据分别记录。
投影未知迁移会明确提示损失或拒绝转换；原文件保留。Mac 仅 ad-hoc 签名，没有开发者签名或公证。
内存整理独立实现，不包含 PCL 程序或未公开代码；不结束进程或改变长期内存策略。

## 成品身份

以下成品明确选入交接包 _handoff/artifacts/，每行记录字节数和 SHA256。
独立源码 ZIP 与交接 ZIP 的外层摘要在 Release SHA256SUMS.txt 中，避免文档自身摘要循环。

| 文件 | 字节数 | SHA256 |
| --- | ---: | --- |
| KAMUCL-1.1.6.exe | 91926725 | bf50a21dbefada44834d8270605c6ec2a64b2f65fe7790a948ceb669fba9be9f |
| KAMUCL-1.1.6-windows-x64.zip | 91958189 | 6628c3f0ebcbf1a8e07314e0cb8d5c34742bb718098c4b6e30a4f306efd34104 |
| KAMUCL-1.1.6-windows-x64-unpacked.zip | 138025371 | 58b27b6e9a3fafe8ae60e2af3f2a549c6f28d06324e356bb9e8530daebefcb56 |
| KAMUCL-1.1.6-mac-arm64.dmg | 103589769 | 64c663d41da9a1470fa9552f66e02eb40807c9b225760979a25b892c00bd9464 |
| KAMUCL-1.1.6-mac-arm64.zip | 95121166 | ac8aac9599d5502e90cf8e3fcc7c5bf127bc01c0a39d95fb378dc0dc074a5e37 |
| KAMUCL-1.1.6-mac-x64.dmg | 110809802 | 3d41f7d27f4b56e04327215369fbbd331ee33220f837bdcaa2851f9ca289e245 |
| KAMUCL-1.1.6-mac-x64.zip | 101261197 | 9daf551707d6043a948416e9b2b01e7f1d243402cd0f159f2afd7b1e352efffd |


## 验证与后续使用

交接包记录的便携验证入口：node scripts/check-licenses.cjs。
接收者先核对外层 SHA256，再核对 _handoff/manifest.json 并运行 START_HERE.md 中的验证命令。
源码包不包含 .git、node_modules、缓存、账户、游戏、凭据或无关个人文件；所需源码及固定依赖版本完整保留。
