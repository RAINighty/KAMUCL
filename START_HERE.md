# KAMUCL 1.1.6 交付入口

本包包含六项功能的源码、资源、锁文件、测试、许可证与已验证的发布成品。
功能入口和投影转换边界见 `docs/FEATURES_1.1.6.md`，当前验证状态和成品摘要见 `CURRENT_STATUS.md`。

## 使用成品

Windows x64 使用 `KAMUCL-1.1.6.exe`，或先解压 `KAMUCL-1.1.6-windows-x64.zip`。
保留 EXE 旁的 `KAMUCL-runtime` 缓存；无法运行自解压包装器时可使用 unpacked ZIP。
Mac 按芯片选择 arm64 或 x64 的 DMG / ZIP，将 APP 放到 Applications。
Mac 成品采用 ad-hoc 签名，未进行 Apple Developer ID 签名或公证。
交接 ZIP 的成品位于 `_handoff/artifacts/`；GitHub Release 提供各平台的独立下载。

## 环境与构建

源码开发需要 Node.js 22 或更高版本、npm、Git、JDK 17 或更高版本及网络访问。
必须将 `JAVA_HOME` 指向包含 `javac` 和 `jar` 的完整 JDK。
Windows 使用 PowerShell；Mac 原生构建需要 Xcode 命令行工具及对应架构的 macOS。
工具、运行库和游戏依赖会从其官方服务下载，缓存不包含在源码或交接包内。
登录账号、VoxLink 工单凭据、发布令牌和签名材料由使用者另行提供，本包不包含这些内容。

```text
npm ci
node scripts/build-bridge.cjs
npx tsc --noEmit
npm test
npm run license:check
npm run build
```

Windows 成品命令为 `npm run dist:win`。Mac 原生双架构交付流程见
`.github/workflows/mac-build.yml`；macOS 当前使用 Electron 33.4.11，Windows 使用 Electron 44.3.0。
不要在 Windows 上把交叉打包结果作为 Mac 实际启动验收。

## 干净解压验证

无需安装 npm 依赖即可运行许可证与对应源码检查，失败时退出码非零：

```text
node scripts/check-licenses.cjs
```

交接包记录的验证命令为 `['node', 'scripts/check-licenses.cjs']`。
`_handoff/manifest.json` 和 `_handoff/SHA256SUMS.txt` 记录每个文件的 SHA256。
独立源码 ZIP 使用 `SOURCE-MANIFEST.json` 记录摘要；发行成品使用 Release 的 `SHA256SUMS.txt`。
先核对下载文件的外层摘要，再解压、核对逐文件摘要并执行上述命令。
源码干净构建通过不意味着与包含签名和打包元数据的成品逐字节相同。

## 验证入口

- `tests/extension-features.test.ts`、`tests/voxlink-116.test.ts`：本批格式、协议与数据规则。
- `scripts/verify-windows-package.cjs`：Windows 成品、中文路径解压、冷/热启动和完整文件。
- `scripts/verify-ui-refinement.cjs`：隔离成品 GUI；设置 `KAMUCL_EXTENSION_GUI=1` 同时检查新功能。
- `scripts/verify-mac.cjs`：原生 APP / DMG、材质、默认皮肤和公共功能 GUI。
- `scripts/verify-voxlink-live.cjs --live`：创建临时私有房间，检查实际上游中继后退出并释放。

真实微软皮肤上传、工单附件提交、跨 Java 客户端和公网对称 NAT 仍需实际参与者验证。
隔离账号和模拟服务测试不能作为上述实际场景已通过的证据。
