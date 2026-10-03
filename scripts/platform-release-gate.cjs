// Product artifacts alone are not a native desktop or feature-parity certificate.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const targets = ['mac-arm64', 'mac-x64', 'linux-x64', 'linux-arm64']
function verifyPlatformRelease(root, version) {
  const file = path.join(root, 'release/platform-acceptance.json')
  assert(fs.existsSync(file), '缺少最终原生平台验收记录，不能公开多平台正式版')
  const review = JSON.parse(fs.readFileSync(file, 'utf8'))
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  assert.equal(review.version, version); assert.equal(review.sourceCommit, head)
  assert.equal(review.schema, 1); assert(review.independentReviewer, '缺少独立评审者')
  for (const id of targets) {
    const result = review.platforms?.find(p => p.id === id)
    assert(result, '缺少平台验收：' + id)
    for (const field of ['nativeBuild', 'nativeDesktop', 'gameWorldSaved', 'cleanInstall', 'credentialsRestart', 'updateRollback', 'allRequiredFunctions']) assert.equal(result[field], true, id + ' 未通过 ' + field)
    assert.equal(result.criticalDefects, 0, id + ' 有关键缺陷')
    assert(Array.isArray(result.unverifiedRequired) && result.unverifiedRequired.length === 0, id + ' 仍有未验证必测项')
    for (const key of ['visual', 'interaction', 'motion']) assert(Number.isFinite(result.scores?.[key]) && result.scores[key] >= 9 && result.scores[key] <= 10, id + ' 独立评分未达标：' + key)
    const [, arch] = id.split('-'), platform = id.startsWith('mac-') ? 'mac' : 'linux'
    const expected = (platform === 'mac' ? ['dmg', 'zip'] : ['AppImage', 'deb', 'tar.gz']).map(extension => `KAMUCL-${version}-${platform}-${arch}.${extension}`)
    assert(Array.isArray(result.artifacts), id + ' 没有绑定成品')
    assert.deepEqual(result.artifacts.map(a => a.name).sort(), expected.sort(), id + ' 成品不完整或来自其他平台')
    for (const artifact of result.artifacts) {
      assert(artifact.name && path.basename(artifact.name) === artifact.name && /^[a-f\d]{64}$/.test(artifact.sha256))
      const content = fs.readFileSync(path.join(root, 'release', artifact.name))
      assert.equal(content.length, artifact.size)
      assert.equal(crypto.createHash('sha256').update(content).digest('hex'), artifact.sha256, '验收后成品已变化：' + artifact.name)
    }
    assert(Array.isArray(result.evidence), id + ' 缺少原始证据')
    for (const kind of ['screenshots', 'original-video', 'frame-timings', 'function-matrix', 'native-game', 'update-rollback']) assert(result.evidence.some(e => e.kind === kind), id + ' 缺少 ' + kind)
    for (const evidence of result.evidence) {
      assert(typeof evidence.path === 'string' && !path.isAbsolute(evidence.path) && !evidence.path.split(/[\\/]/).includes('..'))
      const bytes = fs.readFileSync(path.join(root, evidence.path))
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), evidence.sha256, id + ' 证据摘要不匹配')
    }
  }
  return review
}
module.exports = { verifyPlatformRelease, targets }
