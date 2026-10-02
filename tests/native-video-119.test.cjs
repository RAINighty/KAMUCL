const test = require('node:test'), assert = require('node:assert/strict')
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), { createHash } = require('node:crypto')
const { captureRequest, captureStatistics, stopOwnedHelper, verifyPixels } = require('../scripts/verify-kamu-native-video-119.cjs')

function geometry() {
  return { native: { ownerPID: 123, bounds: { x: 100, y: 50, width: 1000, height: 700 }, contentBounds: { x: 100, y: 50, width: 1000, height: 700 }, zoom: 2, visible: true, focused: true, minimized: false, appHidden: false, activeDisplay: { id: 8, scaleFactor: 2, bounds: { x: 0, y: 0, width: 1920, height: 1080 } } }, state: { hidden: false, focus: true, viewport: { width: 500, height: 350, scale: 1 }, footprint: { x: 17, y: 47, width: 48, height: 72 } } }
}
test('native crop uses actual content bounds and zoom once, keeps Retina backing scale distinct', () => {
  const { native, state } = geometry(), request = captureRequest(native, state)
  assert.deepEqual(request.crop, { x: 110, y: 120, width: 144, height: 192 })
  assert.equal(request.expectedScale, 2); assert.equal(request.ownerPID, 123); assert.equal(request.displayID, 8)
  assert.throws(() => captureRequest(native, { ...state, viewport: { ...state.viewport, scale: 1.2 } }), /pinch/)
  assert.throws(() => captureRequest({ ...native, focused: false }, state), /foreground/)
  assert.throws(() => captureRequest(native, { ...state, viewport: { ...state.viewport, width: 1000 } }), /viewport/)
  assert.throws(() => captureRequest({ ...native, activeDisplay: { ...native.activeDisplay, bounds: { x: 0, y: 0, width: 150, height: 150 } } }, state), /cross/)
})

test('native statistics preserve original complete timestamps, expose duplicates and exclude idle/invalid updates', () => {
  const make = (index, seconds, hash, status = 'complete') => ({ index, complete: status === 'complete', validSample: true, file: 'frame.bgra', status, sha256: hash, presentationTime: { numeric: true, seconds }, callbackClock: { machAbsoluteTime: String(100 + index * 10) } })
  const frames = [make(0, 2, 'a'), make(1, 2.02, 'a', 'idle'), make(2, 2.04, 'a'), make(3, 2.07, 'b'), make(4, 2.1, 'c')]
  const capture = { frames, dropCount: null, dropCountKnown: false }, before = JSON.stringify(capture)
  const stats = captureStatistics(capture, { start: { clock: { machAbsoluteTime: '120' } }, complete: { clock: { machAbsoluteTime: '140' } } })
  assert.equal(stats.allSampleCount, 5); assert.equal(stats.completePixelSampleCount, 4); assert.equal(stats.nonCompleteOrInvalidCount, 1)
  assert.equal(stats.samePixelsAsPreviousComplete, 1); assert.equal(stats.changedPixelCount, 3)
  assert.equal(stats.dropCount, null); assert.equal(stats.dropCountKnown, false)
  assert.deepEqual(stats.activeWindow.sampleIndices, [2, 3, 4]); assert.equal(JSON.stringify(capture), before)
  assert.throws(() => captureStatistics({ ...capture, frames: [make(0, 3, 'a'), make(1, 2, 'b')] }), /actually increase/)
  assert.throws(() => captureStatistics({ ...capture, frames: [make(0, 3, 'a', 'idle'), make(1, 4, 'b', 'idle')] }), /two actual/)
})

test('owned helper stop is graceful; even stop-request I/O failure terminates only its own child and remains failure', async () => {
  let asked = false, killed = []
  const child = { pid: 444, exitCode: null, signalCode: null, kill: signal => killed.push(signal) }
  assert.deepEqual(await stopOwnedHelper(child, Promise.resolve({ code: 0 }), () => { asked = true }), { code: 0 })
  assert(asked); assert.deepEqual(killed, [])
  const original = Error('write stop failed'); let resolveExit
  const exit = new Promise(resolve => { resolveExit = resolve })
  child.kill = signal => { killed.push(signal); child.signalCode = signal; resolveExit({ code: null, signal }) }
  await assert.rejects(stopOwnedHelper(child, exit, () => { throw original }, 5), error => error === original)
  assert.deepEqual(killed, ['SIGTERM'])
  await assert.rejects(stopOwnedHelper({ pid: undefined }, exit, () => assert.fail('request on unowned process')), /only the spawned/)
})

test('owned stream stop deadline is a failure even if terminating the hung helper succeeds', async () => {
  const kills = []; let resolveExit
  const exit = new Promise(resolve => { resolveExit = resolve })
  const child = { pid: 445, exitCode: null, signalCode: null, kill: signal => { kills.push(signal); child.signalCode = signal; resolveExit({ code: null, signal }) } }
  await assert.rejects(stopOwnedHelper(child, exit, () => {}, 5), /graceful stop timed out/)
  assert.deepEqual(kills, ['SIGTERM'])
})

test('raw BGRA remains immutable and derived PNG is exact RGBA, including transparent color bytes', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kamu-native-pixels-'))
  t.after(() => { assert.equal(path.dirname(dir), os.tmpdir()); assert(path.basename(dir).startsWith('kamu-native-pixels-')); fs.rmSync(dir, { recursive: true, force: true }) })
  const bytes = Buffer.from([9, 17, 33, 255, 40, 50, 60, 0, 77, 88, 99, 127, 0, 255, 255, 255])
  const file = 'frame-000000.bgra', hash = createHash('sha256').update(bytes).digest('hex')
  fs.writeFileSync(path.join(dir, file), bytes)
  const frame = { index: 0, file, width: 2, height: 2, sha256: hash }
  const result = await verifyPixels(dir, { frames: [frame] })
  assert.equal(result.length, 1); assert.equal(result[0].losslessPixelsVerified, true); assert.equal(result[0].originalSHA256, hash)
  assert(fs.readFileSync(path.join(dir, file)).equals(bytes))
  await assert.rejects(verifyPixels(dir, { frames: [frame] }), /replace/)
  await assert.rejects(verifyPixels(dir, { frames: [{ ...frame, sha256: 'wrong' }] }), /SHA/)
  await assert.rejects(verifyPixels(dir, { frames: [{ ...frame, file: '../outside.bgra' }] }), /untrusted/)
})
