// Native packaging preserves dependencies, executable modes, Mach-O signatures and symlinks.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
if (process.platform !== 'darwin') throw new Error('Mac 包必须在 macOS 构建和签名；请运行 GitHub Actions 的 macOS packages 工作流。')
const arch = process.argv[2] || process.arch
if (arch !== process.arch || !['arm64', 'x64'].includes(arch)) throw new Error('请在对应架构的 Mac 上打包并验证。')
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' })
run('node', ['scripts/build-bridge.cjs'])
run('npm', ['run', 'build'])
run('npx', ['electron-builder', '--mac', 'dir', `--${arch}`, '--config.electronVersion=33.4.11', '--publish', 'never'])
const bundle = `release/mac${arch === 'arm64' ? '-arm64' : ''}/KAMUCL.app`
run('codesign', ['--force', '--deep', '--sign', '-', bundle])
run('codesign', ['--verify', '--deep', '--strict', bundle])
run('node', ['scripts/verify-mac.cjs', bundle, arch])
const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', bundle, `release/KAMUCL-${version}-mac-${arch}.zip`])
