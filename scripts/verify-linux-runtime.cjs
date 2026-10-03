const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const asar = require('asar')
function verifyLinuxRuntime(directory, arch = process.arch, kind = 'portable-directory') {
  const root = path.resolve(directory), executable = path.join(root, 'kamucl')
  const header = fs.readFileSync(executable).subarray(0, 64)
  assert.equal(header.toString('binary', 0, 4), '\x7fELF'); assert.equal(header[4], 2); assert.equal(header[5], 1)
  assert.equal(header.readUInt16LE(18), arch === 'arm64' ? 183 : 62, 'Wrong Linux architecture')
  assert(fs.statSync(executable).mode & 0o111, 'Launcher is not executable')
  for (const file of ['chrome-sandbox', 'icudtl.dat', 'libEGL.so', 'libGLESv2.so', 'resources/app.asar', 'resources/app.asar.unpacked/out/main/LinuxGameWindow', 'resources/app.asar.unpacked/out/main/kamucl-bridge.jar']) assert(fs.statSync(path.join(root, file)).size > 0, 'Missing runtime: ' + file)
  const metadata = { product: 'KAMUCL', platform: 'linux', arch, version: require('../package.json').version, installationKind: kind }
  fs.writeFileSync(path.join(root, 'resources/kamucl-linux.json'), JSON.stringify(metadata, null, 2))
  const archive = path.join(root, 'resources/app.asar'), names = asar.listPackage(archive).map(n => n.replaceAll('\\', '/').replace(/^\//, ''))
  for (const name of names) {
    if (asar.statFile(archive, name.split('/').join(path.sep)).files) continue
    assert(/^(node_modules\/|out\/(main|preload|renderer)\/|licenses\/|LICENSE$|THIRD_PARTY_NOTICES\.md$|package\.json$|docs\/CORRESPONDING_SOURCE\.md$)/.test(name), 'Unexpected application file: ' + name)
    assert(!/pelican-bicycle|accounts\.json|settings\.json|Downloads|独\.zip/.test(name), 'Private or unrelated data included')
  }
  assert.equal(JSON.parse(asar.extractFile(archive, 'package.json').toString()).version, metadata.version)
  return { directory: root, arch, kind, version: metadata.version, archiveEntries: names.length, complete: true }
}
module.exports = context => { if (context.electronPlatformName === 'linux') verifyLinuxRuntime(context.appOutDir) }
module.exports.verifyLinuxRuntime = verifyLinuxRuntime
if (require.main === module) console.log(JSON.stringify(verifyLinuxRuntime(process.argv[2], process.argv[3])))
