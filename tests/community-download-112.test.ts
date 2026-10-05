import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import AdmZip from 'adm-zip'
import { build } from 'esbuild'
import { downloadFileName } from '../src/main/core/downloadFileName'
import type { CommunityFile, ProgressEvent } from '../src/shared/types'

const sha1 = (bytes: Buffer) => crypto.createHash('sha1').update(bytes).digest('hex')
let bundle: Promise<string> | undefined

/** Real transfer, ZIP classification, extraction and instance transaction; only Electron paths are private. */
async function fixture(t: any) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kamucl-community112-'))
  const temp = path.join(root, 'temp'), first = path.join(root, '游戏盘一'), second = path.join(root, '游戏盘二')
  for (const folder of [temp, first, second, path.join(root, 'userData')]) fs.mkdirSync(folder)
  bundle ??= build({ stdin: { contents: `export { communityDownload } from './src/main/core/community';
    export { getSettings } from './src/main/core/settings';
    export { listAllInstalled } from './src/main/core/versions';
    export { closeHttpClient } from './src/main/core/httpClient';`, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent'
  }).then(result => result.outputFiles[0].text)
  const require = createRequire(path.resolve('package.json')), module = { exports: {} as any }
  new Function('require', 'module', 'exports', await bundle)((name: string) => name === 'electron'
    ? { app: { getPath: (name: string) => path.join(root, name), getVersion: () => 'test', getName: () => 'test', isPackaged: false } }
    : name === 'node:os' ? { ...require(name), tmpdir: () => temp } : require(name), module, module.exports)
  const runtime = module.exports
  Object.assign(runtime.getSettings(), { gameDir: second, activeFolder: second, mirror: 'official', downloadThreads: 2,
    folders: [{ path: first, name: '默认下载盘', isDefault: true }, { path: second, name: '浏览盘', isDefault: false }] })
  t.after(async () => { await runtime.closeHttpClient(); fs.rmSync(root, { recursive: true, force: true }) })
  return { root, temp, first, second, runtime }
}

function fullpack(): Buffer {
  const zip = new AdmZip()
  zip.addFile('.minecraft/versions/fixture/fixture.json', Buffer.from(JSON.stringify({ id: 'fixture', _mcVersion: '1.20.1', mainClass: 'fixture.Main', libraries: [] })))
  zip.addFile('.minecraft/versions/fixture/fixture.jar', Buffer.from('fixture-client'))
  zip.addFile('.minecraft/mods/中文 § 模组.jar', Buffer.from('fixture-mod'))
  zip.addFile('.minecraft/options.txt', Buffer.from('fixture-options'))
  zip.addFile('.minecraft/saves/保留世界/level.dat', Buffer.from('fixture-world'))
  return zip.toBuffer()
}

async function serve(t: any, listener: http.RequestListener) {
  const server = http.createServer(listener)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())) })
  return `http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`
}

const file = (url: string, bytes: Buffer, name = 'Yet Another Bingo: Ultimate-2.14.0.mrpack'): CommunityFile => ({
  source: 'modrinth', projectId: 'fixture', fileId: 'fixture', fileName: name, version: 'fixture', url, size: bytes.length, sha1: sha1(bytes), gameVersions: [], loaders: [], releaseType: 'release', date: '2026-10-05'
})

test('local filename policy preserves legal Unicode labels, extensions and URL-encoded literals, without replacement collisions', () => {
  for (const name of ['中文 § 空格.jar', '包：全角冒号.mrpack', 'safe.zip', 'literal%3Aname%2Fstill-label.mrpack']) assert.equal(downloadFileName(name), name)
  const illegal = ['Bingo: Ultimate.mrpack', 'A<B>"C|D?E*.zip', 'CON.jar', 'con .zip', 'LPT².txt', 'NUL', '结束. ', '空\u0000格.jar', '中文'.repeat(150) + '.mrpack']
  for (const name of illegal) {
    const result = downloadFileName(name)
    assert(!/[<>:"|?*\\/\u0000-\u001f\u007f]/.test(result), name)
    assert(!/[. ]$/.test(result), name)
    assert(Buffer.byteLength(result) <= 200, name)
    assert.equal(result, downloadFileName(name), 'retry uses the same destination')
    if (name.endsWith('.mrpack')) assert.equal(path.extname(result), '.mrpack')
  }
  assert.notEqual(downloadFileName('a:b.zip'), downloadFileName('a?b.zip'))
  assert.notEqual(downloadFileName('a:b.zip'), downloadFileName('a_b.zip'))
  assert.equal(downloadFileName(''), 'download.bin')
  for (const name of ['../escape.zip', '..\\escape.zip', '/root.zip', 'C:\\a.jar', '.', '..', 'folder/file.jar']) assert.throws(() => downloadFileName(name), /目录|路径跳转/)
})

test('real filesystem commits colon, reserved and long Unicode labels by .part rename', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kamucl-filename112-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const names = ['Yet Another Bingo: Ultimate-2.14.0.mrpack', '中文 § 全角：.zip', 'CON.jar', 'LPT².jar', '中文'.repeat(150) + '.mrpack']
  for (const name of names) {
    const dest = path.join(root, downloadFileName(name)), bytes = Buffer.from(name)
    fs.writeFileSync(dest + '.part', bytes)
    fs.renameSync(dest + '.part', dest)
    assert.deepEqual(fs.readFileSync(dest), bytes)
    assert(!fs.existsSync(dest + '.part'))
  }
  if (process.platform === 'win32') {
    const unsafe = path.join(root, 'Bingo: Ultimate.mrpack')
    assert.throws(() => { fs.writeFileSync(unsafe + '.part', 'old-path'); fs.renameSync(unsafe + '.part', unsafe) }, { code: 'EINVAL' })
  }
})

test('production community download keeps original URL/digest/display label and freezes the accepted default across settings changes', { timeout: 15000 }, async t => {
  const { temp, first, second, runtime } = await fixture(t), bytes = fullpack(), events: ProgressEvent[] = []
  const originalName = 'Yet Another Bingo: Ultimate-2.14.0.mrpack', exactPath = '/' + encodeURIComponent(originalName)
  const requests: string[] = []
  const base = await serve(t, (req, res) => {
    requests.push(req.url!)
    assert.equal(fs.readdirSync(temp).length, 1)
    runtime.getSettings().folders.forEach((folder: any) => { folder.isDefault = folder.path === second })
    runtime.getSettings().activeFolder = second
    res.writeHead(200, { 'content-length': bytes.length }); res.end(bytes)
  })
  const original = file(base + exactPath, bytes), snapshot = structuredClone(original), done = Promise.withResolvers<any>()
  assert.equal(await runtime.communityDownload(original, { versionId: '', kind: 'modpack' }, (event: ProgressEvent) => events.push(event), done.resolve), '整合包已开始安装')
  const outcome = await done.promise
  assert.equal(outcome.ok, true)
  assert.deepEqual(original, snapshot, 'metadata URL, filename and hash remain immutable')
  assert.deepEqual(requests, [exactPath])
  assert(events.some(event => event.text.includes(originalName)))
  assert.equal(fs.readFileSync(path.join(first, 'versions', outcome.versionId, 'mods', '中文 § 模组.jar'), 'utf8'), 'fixture-mod')
  assert.equal(fs.readFileSync(path.join(first, 'versions', outcome.versionId, 'saves', '保留世界', 'level.dat'), 'utf8'), 'fixture-world')
  assert(!fs.existsSync(path.join(second, 'versions')))
  assert.deepEqual(fs.readdirSync(temp), [], 'completed notification follows owned temp cleanup')
})

test('same-label simultaneous pack downloads allocate separate task directories and clean both after real installs', { timeout: 15000 }, async t => {
  const { temp, first, runtime } = await fixture(t), bytes = fullpack(), held: http.ServerResponse[] = [], taskDirs: string[][] = []
  const base = await serve(t, (_req, res) => {
    held.push(res)
    if (held.length === 2) {
      taskDirs.push(fs.readdirSync(temp))
      for (const response of held) { response.writeHead(200, { 'content-length': bytes.length }); response.end(bytes) }
    }
  })
  const completions = [Promise.withResolvers<any>(), Promise.withResolvers<any>()]
  await Promise.all(completions.map(done => runtime.communityDownload(file(base + '/same', bytes), { versionId: '', kind: 'modpack' }, () => {}, done.resolve)))
  const outcomes = await Promise.all(completions.map(done => done.promise))
  assert.equal(taskDirs[0].length, 2)
  assert.notEqual(taskDirs[0][0], taskDirs[0][1])
  assert(outcomes.every(outcome => outcome.ok))
  assert.notEqual(outcomes[0].versionId, outcomes[1].versionId)
  for (const outcome of outcomes) assert(fs.existsSync(path.join(first, 'versions', outcome.versionId, 'options.txt')))
  assert.deepEqual(fs.readdirSync(temp), [])
})

for (const failure of ['http', 'digest', 'cancel-download', 'invalid-pack', 'cancel-install'] as const) {
  test(`pack ${failure} retains its original failure and drains/cleans its own temporary directory`, { timeout: 15000 }, async t => {
    const { temp, runtime } = await fixture(t), controller = new AbortController(), bytes = failure === 'invalid-pack' ? Buffer.from('not a ZIP') : fullpack()
    const base = await serve(t, (_req, res) => {
      if (failure === 'http') { res.writeHead(404); res.end('missing'); return }
      res.writeHead(200, { 'content-length': bytes.length })
      if (failure === 'cancel-download') { res.write(bytes.subarray(0, 4)); controller.abort(new Error('fixture download cancel')); return }
      res.end(bytes)
    })
    const input = file(base + '/pack', bytes), done = Promise.withResolvers<any>(), events: ProgressEvent[] = []
    if (failure === 'digest') input.sha1 = '0'.repeat(40)
    const invocation = runtime.communityDownload(input, { versionId: '', kind: 'modpack' }, (event: ProgressEvent) => {
      events.push(event)
      if (failure === 'cancel-install' && event.stage === 'modpack') controller.abort(new Error('fixture install cancel'))
    }, done.resolve, controller.signal)
    if (['http', 'digest', 'cancel-download'].includes(failure)) await assert.rejects(invocation, failure === 'http' ? /404/ : failure === 'digest' ? /sha1.*校验失败/ : /fixture download cancel/)
    else {
      await invocation
      const outcome = await done.promise
      assert.equal(outcome.ok, false)
      assert(outcome.error)
      assert.equal(events.filter(event => event.stage === 'error').length, 1)
    }
    assert(!events.some(event => event.stage === 'done'))
    assert.deepEqual(fs.readdirSync(temp), [])
  })
}

test('ordinary resource download remains attached to its existing instance while settings change; traversal and unknown folders do not reach HTTP', { timeout: 15000 }, async t => {
  const { temp, first, second, runtime } = await fixture(t), id = '已有实例', bytes = Buffer.from('resource bytes'), requests: string[] = []
  fs.mkdirSync(path.join(first, 'versions', id), { recursive: true })
  fs.writeFileSync(path.join(first, 'versions', id, id + '.json'), JSON.stringify({ id, _gameDir: true, mainClass: 'fixture.Main', libraries: [] }))
  runtime.getSettings().activeFolder = first
  runtime.listAllInstalled()
  const base = await serve(t, (req, res) => {
    requests.push(req.url!)
    runtime.getSettings().folders.forEach((folder: any) => { folder.isDefault = folder.path === second })
    runtime.getSettings().activeFolder = second
    res.end(bytes)
  })
  const destination = await runtime.communityDownload(file(base + '/mod', bytes, '普通: 模组.jar'), { versionId: id, kind: 'mod' }, () => {})
  assert.equal(path.dirname(destination), path.join(first, 'versions', id, 'mods'))
  assert.deepEqual(fs.readFileSync(destination), bytes)
  assert(!fs.existsSync(path.join(second, 'mods')))
  for (const label of ['../outside.jar', '..\\outside.jar']) await assert.rejects(runtime.communityDownload(file(base + '/unsafe', bytes, label), { versionId: id, kind: 'mod' }, () => {}), /目录|路径跳转/)
  await assert.rejects(runtime.communityDownload(file(base + '/unknown', bytes), { versionId: '', kind: 'modpack', folder: path.join(first, '未登记') }, () => {}), /未.*登记/)
  assert.deepEqual(requests, ['/mod'])
  assert.deepEqual(fs.readdirSync(temp), [])
})
