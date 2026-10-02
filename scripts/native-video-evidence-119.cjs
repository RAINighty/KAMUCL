const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const { createHash } = require('node:crypto')

// Collection integrity is separate from optional capture success and its FPS.
module.exports = function verify({ root, version, stage, startedAt, theme = 'black-orange' }) {
  assert(['app', 'dmg'].includes(stage), 'native video collection requires an explicit APP/DMG stage')
  const stem = `kamu-native-video-119-${stage}-${theme}`
  const receiptName = `kamu-native-video-diagnostic-119-${stage}-${theme}.json`
  const directory = path.resolve(root, stem), receipt = path.resolve(root, receiptName)
  const current = file => { assert(fs.existsSync(file), 'native video collection missing current evidence: ' + file); assert(fs.statSync(file).mtimeMs >= startedAt, 'native video collection has stale evidence: ' + file) }
  current(receipt)
  const proof = JSON.parse(fs.readFileSync(receipt, 'utf8'))
  assert.equal(proof.version, version, 'native video version must match build')
  assert.equal(proof.stage, stage, 'native video stage must match wrapper')
  assert.equal(path.resolve(proof.directory), directory, 'native video directory must match collected stage')
  assert.equal(path.resolve(proof.file), receipt, 'native video receipt must match collected stage')
  let rawFrames = 0, pngFrames = 0
  if (proof.capture) current(path.join(directory, 'capture.json'))
  for (const frame of proof.capture?.frames || []) {
    if (!frame.file) continue
    assert(/^frame-\d{6}\.bgra$/.test(frame.file), 'native video raw filename must be safe and collected')
    const file = path.join(directory, frame.file); current(file); current(path.join(directory, frame.file.replace(/\.bgra$/, '.json')))
    assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'), frame.sha256, 'native video raw hash must match receipt')
    rawFrames++
  }
  for (const frame of proof.pngs || []) {
    assert(/^frame-\d{6}\.png$/.test(frame.file), 'native video PNG filename must be safe and collected')
    const file = path.join(directory, frame.file); current(file)
    assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'), frame.sha256, 'native video PNG hash must match receipt')
    pngFrames++
  }
  if (proof.complete) { assert(rawFrames > 0, 'complete native video requires original frames'); assert.equal(pngFrames, rawFrames, 'complete native video requires every lossless PNG') }
  return { receipt: receiptName, directory: stem, collected: true, complete: proof.complete, rawFrames, pngFrames, nativeDeliveryBenchmark: proof.nativeDeliveryBenchmark ?? null, error: proof.error ?? null }
}
