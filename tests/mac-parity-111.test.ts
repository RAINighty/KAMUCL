import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const requireFixture = createRequire(path.resolve('package.json'))
const { ROUTES, THEMES, LAYOUTS, ROUTE_COMPONENTS, assertNavigationCoverage, assertQueueLedger, publicAccount, stableHash, createQueueClickObserver } = requireFixture('./scripts/verify-mac-parity-ui.cjs')
const { parityRoot, assertRestartIdentity, assertNaturalOwnedClose, safeEvidence } = requireFixture('./scripts/verify-mac-parity.cjs')
function temporary(t: TestContext) {
  const base = fs.realpathSync.native(os.tmpdir()), root = fs.realpathSync.native(fs.mkdtempSync(path.join(base, 'KAMUCL synthetic Mac parity contract ')))
  assert(root.startsWith(base + path.sep))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}
function navigation() {
  return THEMES.flatMap((theme: string) => LAYOUTS.flatMap(([width, height, zoom]: number[]) => ROUTES.map((route: string) => ({
    theme, width, height, zoom, route, selectedRoute: route, actualTheme: theme, component: ROUTE_COMPONENTS[route], componentChain: ['ChildWidget', ROUTE_COMPONENTS[route], 'AsyncComponentWrapper'],
    native: { platform: 'darwin', visible: true, focused: true, minimized: false, zoom }, coordinate: { hit: true }, renderer: { hasFocus: true, hidden: false }, layout: { horizontalOverflow: false }, screenshot: 'mac-parity-first-scene.png', bytes: 1024, sha256: 'a'.repeat(64)
  }))))
}
function queue() {
  const clicks = Array.from({ length: 40 }, (_, i) => ({ trusted: true, at: i, afterAt: i + .1, beforePhase: 1, afterPhase: 3, before: Math.min(32, i), after: Math.min(32, i + 1), accepted: i < 32, expectedLimit: 32, acceptedBefore: Math.min(32, i), acceptedAfter: Math.min(32, i + 1), rejectedBefore: Math.max(0, i - 32), rejectedAfter: Math.max(0, i - 31) }))
  const audio = Array.from({ length: 32 }, (_, i) => ({ role: 'palm', at: 300 + i * 150, duration: .095, peak: .5 }))
  const contacts = audio.map((row, i) => ({ contacts: i + 1, contactAt: row.at + .1 }))
  return { ledger: { clicks, audio, contacts, busyVisible: true }, before: { contacts: 0, count: 100 }, after: { contacts: 32, count: 132, persistedCount: 132, phase: 'front', queue: 0 } }
}
test('Mac parity scene contract requires all 240 unique route/theme/native-layout observations', () => {
  const rows = navigation()
  assert.equal(rows.length, 240)
  assertNavigationCoverage(rows)
  const missing = rows.slice(1)
  assert.throws(() => assertNavigationCoverage(missing))
  const duplicate = structuredClone(rows); duplicate[1] = duplicate[0]
  assert.throws(() => assertNavigationCoverage(duplicate), /duplicate/)
})
test('Mac scene contract rejects selected-nav-only snapshots, hidden windows, wrong theme/zoom, occlusion and overflow', () => {
  for (const mutation of [
    (row: any) => { row.component = 'PriorView' },
    (row: any) => { row.componentChain = ['PriorView'] },
    (row: any) => { row.native.focused = false },
    (row: any) => { row.native.platform = 'linux' },
    (row: any) => { row.native.zoom = 2 },
    (row: any) => { row.actualTheme = 'blue-white' },
    (row: any) => { row.coordinate.hit = false },
    (row: any) => { row.renderer.hidden = true },
    (row: any) => { row.layout.horizontalOverflow = true }
  ]) {
    const rows = navigation(); mutation(rows[0]); assert.throws(() => assertNavigationCoverage(rows))
  }
})
test('Mac queue contract matches 32 accepted plus overflow to individual actual contacts, sources and saved increments', () => {
  const { ledger, before, after } = queue()
  assert.deepEqual(assertQueueLedger(ledger, before, after), { accepted: 32, rejected: 8, maximumQueue: 32 })
})
test('Mac queue contract rejects synthetic input, unbounded queues, lost sounds, duplicate contacts and unsynchronized sources', () => {
  for (const mutation of [
    (v: any) => { v.ledger.clicks[0].trusted = false },
    (v: any) => { v.ledger.clicks[0].afterPhase = 1 },
    (v: any) => { v.ledger.clicks[0].beforePhase = 3 },
    (v: any) => { v.ledger.clicks[0].afterAt = -1 },
    (v: any) => { v.ledger.clicks[31].after = 33 },
    (v: any) => { v.ledger.clicks[35].after = 31 },
    (v: any) => { v.ledger.clicks[35].rejectedAfter = 0 },
    (v: any) => { v.ledger.audio.pop() },
    (v: any) => { v.ledger.contacts[3].contacts = 3 },
    (v: any) => { v.ledger.audio[0].at += 51 },
    (v: any) => { v.after.persistedCount = 100 },
    (v: any) => { v.after.phase = 'return' },
    (v: any) => { v.ledger.busyVisible = false }
  ]) { const value = queue(); mutation(value); assert.throws(() => assertQueueLedger(value.ledger, value.before, value.after)) }
})
test('Mac click observer binds the same original Event capture and bubble around the actual target handler, without a microtask after-read', async () => {
  const dataset = { queue: '0', acceptedClicks: '0', rejectedClicks: '0', contacts: '0' }, ledger = { clicks: [] as any[] }
  let time = 100
  const observer = createQueueClickObserver(ledger, () => dataset, () => ++time)
  const event = { target: { closest: () => true }, isTrusted: true, eventPhase: 1 }
  observer.before(event)
  // A synthetic event-phase fixture reproduces Chromium's possible checkpoint
  // before the target callback. It is not a trusted native GUI pass.
  await Promise.resolve()
  assert.equal(ledger.clicks[0].afterAt, undefined)
  assert.equal(ledger.clicks[0].before, 0)
  event.eventPhase = 2
  dataset.queue = '1'; dataset.acceptedClicks = '1'
  event.eventPhase = 3
  observer.after(event)
  assert.deepEqual({ before: ledger.clicks[0].before, after: ledger.clicks[0].after, accepted: ledger.clicks[0].accepted, beforePhase: ledger.clicks[0].beforePhase, afterPhase: ledger.clicks[0].afterPhase }, { before: 0, after: 1, accepted: true, beforePhase: 1, afterPhase: 3 })
  assert.throws(() => observer.after(event), /Duplicate bubble/)
  assert.throws(() => observer.before(event), /Duplicate capture/)
})
test('Mac click observer cannot use another Event to finish a captured input and records rejected target handling exactly once', () => {
  const dataset = { queue: '32', acceptedClicks: '32', rejectedClicks: '0', contacts: '0' }, ledger = { clicks: [] as any[] }
  const observer = createQueueClickObserver(ledger, () => dataset, () => 100)
  const event = { target: { closest: () => true }, isTrusted: true, eventPhase: 1 }
  observer.before(event)
  observer.after({ ...event, eventPhase: 3 })
  assert.equal(ledger.clicks[0].afterAt, undefined, 'foreign Event cannot supply the after checkpoint')
  dataset.rejectedClicks = '1'; event.eventPhase = 3; observer.after(event)
  assert.equal(ledger.clicks[0].accepted, false); assert.equal(ledger.clicks[0].after, 32)
  assert.equal(ledger.clicks[0].rejectedAfter - ledger.clicks[0].rejectedBefore, 1)
  observer.before({ target: { closest: () => false }, isTrusted: true, eventPhase: 1 })
  assert.equal(ledger.clicks.length, 1, 'unrelated clicks are not queue inputs')
})
test('Mac restart requires a different actual PID with the same profile, signed source, runtime, version and executable', () => {
  const first = { version: 'synthetic', sourceCommit: 'b'.repeat(40), runtimeVersion: 'synthetic-runtime', arch: 'arm64', executable: '/private/app/KAMUCL', profile: '/private/qa/profile', pid: 500 }
  const restart = { ...first, pid: 501, actualUserData: first.profile, publicAccountsPersisted: true, mascotCountsPersisted: true, settingsPersisted: true, favoritePersisted: true }
  assertRestartIdentity(first, restart)
  for (const field of ['sourceCommit', 'runtimeVersion', 'executable', 'profile', 'arch', 'version']) assert.throws(() => assertRestartIdentity(first, { ...restart, [field]: 'foreign' }))
  assert.throws(() => assertRestartIdentity(first, { ...restart, pid: first.pid }))
  assert.throws(() => assertRestartIdentity(first, { ...restart, actualUserData: '/player/profile' }))
  assert.throws(() => assertRestartIdentity(first, { ...restart, settingsPersisted: false }))
})
test('Mac restart cannot call a forced or foreign process termination a normal owned close', () => {
  const actual = { complete: true, child: { pid: 601, closed: true, awaitedClose: true, code: 0, signal: null, events: [{ event: 'close', code: 0, signal: null }] } }
  assertNaturalOwnedClose(actual, 601)
  assert.throws(() => assertNaturalOwnedClose(actual, 602))
  assert.throws(() => assertNaturalOwnedClose({ ...actual, child: { ...actual.child, code: 1 } }, 601))
  assert.throws(() => assertNaturalOwnedClose({ ...actual, child: { ...actual.child, signal: 'SIGTERM' } }, 601))
  assert.throws(() => assertNaturalOwnedClose({ ...actual, child: { ...actual.child, events: [...actual.child.events, { event: 'SIGTERM-request' }] } }, 601))
})
test('Persistent Mac QA root requires a native disposable session, exact ownership and fresh first / existing restart phase', t => {
  const root = temporary(t), token = 'c'.repeat(32), env = { GITHUB_ACTIONS: 'true', KAMUCL_PARITY_PHASE: 'first', KAMUCL_PARITY_ROOT: root, KAMUCL_PARITY_TOKEN: token }
  fs.writeFileSync(path.join(root, 'mac-parity-owner.json'), JSON.stringify({ schemaVersion: 1, root, token }))
  assert.equal(parityRoot(env, 'darwin'), root)
  assert.throws(() => parityRoot(env, 'win32'))
  assert.throws(() => parityRoot({ ...env, GITHUB_ACTIONS: 'false' }, 'darwin'))
  assert.throws(() => parityRoot({ ...env, KAMUCL_PARITY_TOKEN: 'd'.repeat(32) }, 'darwin'))
  assert.throws(() => parityRoot({ ...env, KAMUCL_PARITY_PHASE: 'restart' }, 'darwin'))
  fs.mkdirSync(path.join(root, 'profile')); fs.writeFileSync(path.join(root, 'profile/settings.json'), '{}')
  assert.throws(() => parityRoot(env, 'darwin'))
  assert.equal(parityRoot({ ...env, KAMUCL_PARITY_PHASE: 'restart' }, 'darwin'), root)
})
test('Mac evidence collector copies only exact regular files without path traversal or overwriting original bytes', t => {
  const root = temporary(t), destination = path.join(root, 'proof'); fs.mkdirSync(destination)
  const bytes = Buffer.from('synthetic original evidence'); fs.writeFileSync(path.join(root, 'sample.png'), bytes)
  const row = safeEvidence(root, 'sample.png', path.join(destination, 'copy.png'))
  assert.equal(row.bytes, bytes.length); assert.deepEqual(fs.readFileSync(path.join(destination, 'copy.png')), bytes)
  assert.throws(() => safeEvidence(root, 'sample.png', path.join(destination, 'copy.png')), /EEXIST/)
  assert.throws(() => safeEvidence(root, 'sample.png', path.join(destination, 'foreign.png'), { bytes: bytes.length, sha256: 'f'.repeat(64) }), /bytes must match/)
  assert.throws(() => safeEvidence(root, '../settings.json', path.join(destination, 'bad.png')))
  assert.throws(() => safeEvidence(root, 'proof', path.join(destination, 'directory.png')))
})
test('Public-account projection excludes credentials while whole-settings hashes retain exact values independently of key order', () => {
  assert.deepEqual(publicAccount({ id: 'one', type: 'offline', username: 'PrivateQA', uuid: 'zero', refreshToken: 'fixture-secret', password: 'not-real' }), { id: 'one', type: 'offline', username: 'PrivateQA', uuid: 'zero' })
  assert.equal(stableHash({ a: [1, 2], b: { y: 2, x: 1 } }), stableHash({ b: { x: 1, y: 2 }, a: [1, 2] }))
  assert.notEqual(stableHash({ interval: 1 }), stableHash({ interval: 2 }))
})
