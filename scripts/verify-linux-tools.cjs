// Execute pinned official Linux tools only in this disposable CI profile.
// The second Terracotta service below is also created by this test: never reuse
// a user's /tmp/terracotta or stop an existing launcher/service by name.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), crypto = require('node:crypto'), http = require('node:http')
const childProcess = require('node:child_process')
const { loadCore, ownChild, awaitOwnedClose, stopOwnedChild, preserveBusinessFailure } = require('./verify-linux-business.cjs')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
function get(port, route) {
  assert(Number.isSafeInteger(port) && port > 0 && port < 65536)
  return new Promise((resolve, reject) => {
    const request = http.get({ hostname: '127.0.0.1', port, path: route, timeout: 5000 }, response => {
      let body = ''; response.on('data', chunk => { body += chunk }); response.on('end', () => { if (response.statusCode === 200) resolve(body); else reject(Error('HTTP ' + response.statusCode)) })
    })
    request.once('error', reject); request.once('timeout', () => request.destroy(Error('owned tool API timed out')))
  })
}
async function waitPort(file, track) {
  for (let n = 0; n < 120; n++) {
    assert.equal(track.child.exitCode, null, 'Official Terracotta --hmcl exited before its API was ready')
    try { const value = JSON.parse(fs.readFileSync(file, 'utf8')); if (Number.isSafeInteger(value.port) && value.port > 0) return value.port } catch {}
    await wait(250)
  }
  throw Error('Owned Terracotta port file did not become ready')
}
async function main() {
  const { app } = require('electron')
  assert.equal(process.platform, 'linux'); assert.equal(process.env.GITHUB_ACTIONS, 'true')
  assert.notEqual(process.getuid(), 0); assert.equal(process.arch, process.argv[2]); assert(['arm64', 'x64'].includes(process.arch))
  fs.mkdirSync(path.resolve('out'), { recursive: true })
  const root = fs.mkdtempSync(path.resolve('out/linux-tools-')), proof = path.resolve('release/linux-tools-proof-' + process.arch + '-' + Date.now())
  fs.mkdirSync(proof, { recursive: true }); fs.mkdirSync(path.join(root, 'config')); app.setPath('appData', path.join(root, 'config')); app.setPath('userData', root)
  const report = { version: require('../package.json').version, sourceCommit: childProcess.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), platform: process.platform, arch: process.arch, runtime: process.versions.electron, nativeExecution: true, nativeDesktop: false, complete: false, tools: {}, uncovered: ['authenticated Sakura tunnel to a real external player', 'Terracotta room joining from a real external player', 'game LAN discovery on hardware desktop'] }
  const save = () => fs.writeFileSync(path.join(proof, 'verification.json'), JSON.stringify(report, null, 2))
  const tracks = [], starts = []; let foreign, foreignPort, stopProduct = async () => {}
  const originalTmp = process.env.TMPDIR
  await app.whenReady()
  await preserveBusinessFailure(report, async () => {
    const identity = await loadCore('src/main/core/linuxUpdateIdentity.ts')
    const frp = await loadCore('src/main/core/frp.ts'), frpc = await frp.ensureFrpcInstalled()
    const asset = frp.frpcAsset(), actualHash = sha(frpc)
    assert.equal(actualHash, asset.sha256); identity.assertLinuxElf(fs.readFileSync(frpc).subarray(0, 64)); fs.accessSync(frpc, fs.constants.X_OK)
    const frpcVersion = childProcess.execFileSync(frpc, ['-v'], { encoding: 'utf8', timeout: 10000 }); assert.match(frpcVersion, /0\.51\.0/)
    report.tools.frp = { officialURL: asset.url, sha256: actualHash, actualVersion: frpcVersion.trim(), nativeExecution: true, remoteAuthentication: false }
    const captures = []
    const terracotta = await loadCore('src/main/core/terracotta.ts', { 'node:child_process': { ...childProcess, spawn: (...args) => {
      const child = childProcess.spawn(...args), track = ownChild(child, 'product Terracotta'); tracks.push(track); captures.push({ track, exe: args[0], args: args[1], options: args[2] }); return child
    } } })
    stopProduct = terracotta.stopTerracottaOnQuit
    const handlers = {}; terracotta.registerTerracottaIpc({ handle: (name, fn) => { handlers[name] = fn } })
    await handlers['tc:install'](); const status = await handlers['tc:status'](); assert(status.binaryReady)
    const tcHashes = { x64: 'dc8eed0338a1888743ab38468d88b9dd8a60d60c29df072adba7c8d2edaf7937', arm64: '1cc03ed2ccaab8a7b64e8eb375ccfb8c1d4cd28f4c1a242fe3b492522f9f4aad' }
    assert.equal(sha(status.binaryPath), tcHashes[process.arch]); identity.assertLinuxElf(fs.readFileSync(status.binaryPath).subarray(0, 64)); fs.accessSync(status.binaryPath, fs.constants.X_OK)
    // A fixture-owned existing service demonstrates that the product ignores
    // inherited TMPDIR. All of its lock, identity, logs and children are private.
    const ambient = fs.mkdtempSync(path.join(root, 'fixture-existing-'))
    process.env.TMPDIR = ambient
    const portFile = path.join(ambient, 'http'), descriptor = fs.openSync(path.join(proof, 'fixture-terracotta.log'), 'wx')
    const child = childProcess.spawn(status.binaryPath, ['--hmcl', portFile], { env: { ...process.env, TMPDIR: ambient }, detached: true, stdio: ['ignore', descriptor, descriptor] })
    fs.closeSync(descriptor); foreign = ownChild(child, 'fixture-owned independent Terracotta'); tracks.push(foreign)
    foreignPort = await waitPort(portFile, foreign)
    const initial = JSON.parse(await get(foreignPort, '/state'))
    const startTask = { error: null }
    startTask.promise = handlers['tc:start'](null, { mode: 'host', playerName: 'LinuxNativeFixture' }).then(value => value, error => { startTask.error = error })
    starts.push(startTask)
    let current
    for (let n = 0; n < 120; n++) {
      current = await handlers['tc:status']()
      if (['hosting', 'ready'].includes(current.phase)) break
      if (current.error) throw Error(current.error)
      await wait(250)
    }
    assert(['hosting', 'ready'].includes(current.phase), 'Product IPC did not initialize a private native service')
    assert.equal(captures.length, 1)
    const product = captures[0], privateTmp = product.options.env.TMPDIR
    assert.equal(product.args[0], '--hmcl'); assert.equal(product.options.detached, true)
    assert.notEqual(privateTmp, ambient); assert.equal(path.dirname(privateTmp), path.join(root, 'terracotta'))
    assert.equal(fs.statSync(privateTmp).mode & 0o777, 0o700)
    const productPort = await waitPort(product.args[1], product.track)
    assert.notEqual(productPort, foreignPort); const apiState = JSON.parse(await get(productPort, '/state'))
    assert.equal(foreign.child.exitCode, null); assert.doesNotThrow(() => JSON.parse(fs.readFileSync(portFile, 'utf8')))
    await handlers['tc:stop'](); await startTask.promise; if (startTask.error) throw startTask.error; await awaitOwnedClose(product.track)
    assert(!fs.existsSync(privateTmp), 'Closed private service files were not cleaned')
    assert.equal(foreign.child.exitCode, null, 'Stopping the product must leave the independent fixture service alive')
    assert.deepEqual(JSON.parse(await get(foreignPort, '/state')), initial)
    report.tools.terracotta = { version: '0.4.2', sha256: sha(status.binaryPath), nativeExecution: true, productIPC: true, apiState, independentFixtureStillAliveAfterStop: true, privateTemporaryDirectory: true, privateDirectoryRemovedAfterOwnedClose: true, productChild: product.track.ledger, actualExternalRoom: false }
    await get(foreignPort, '/panic?peaceful=true').catch(error => { if (error.code !== 'ECONNRESET') throw error })
    await awaitOwnedClose(foreign)
    report.complete = true
  }, async () => {
    const cleanupErrors = []
    try { await stopProduct() } catch (error) { cleanupErrors.push(error) }
    try {
      if (foreign && !foreign.ledger.closed && foreignPort) await get(foreignPort, '/panic?peaceful=true').catch(error => { if (error.code !== 'ECONNRESET') throw error })
    } catch (error) { cleanupErrors.push(error) }
    for (const track of tracks) try { await stopOwnedChild(track) } catch (error) { cleanupErrors.push(error) }
    let timer
    try { await Promise.race([Promise.all(starts.map(task => task.promise)), new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Owned product start did not settle after cleanup')), 15000) })]) } catch (error) { cleanupErrors.push(error) } finally { clearTimeout(timer) }
    if (originalTmp === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = originalTmp
    report.children = tracks.map(track => track.ledger)
    for (const task of starts) if (task.error) cleanupErrors.push(task.error)
    if (cleanupErrors.length) throw new AggregateError(cleanupErrors, 'Owned tools cleanup errors; every owned operation was considered')
  }, save)
  console.log('PASS actual Linux official downloads, ELF/hash/mode/version and private Terracotta IPC lifecycle; external peer remains uncovered')
  app.exit(0)
}
module.exports = { waitPort }
if (require.main === module) main().catch(error => { console.error(error); require('electron').app.exit(1) })
