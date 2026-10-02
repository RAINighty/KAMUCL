const fs = require('node:fs'), path = require('node:path')

// Historical evidence may exceed one GitHub asset. Each part is an independent
// ZIP with its own manifest; never publish an incomplete or ambiguous sequence.
module.exports = function historyAssets(directory, version) {
  const prefix = `KAMUCL-${version}-validation-history`
  const names = fs.readdirSync(directory)
  const single = names.includes(prefix + '.zip')
  const parts = names.filter(name => name.startsWith(prefix + '-part') && name.endsWith('.zip')).sort()
  if (single && parts.length) throw Error('历史证据单包与分包并存，停止发布')
  for (let index = 0; index < parts.length; index++) {
    const expected = `${prefix}-part${String(index + 1).padStart(3, '0')}.zip`
    if (parts[index] !== expected) throw Error('历史证据分包序号不连续：' + expected)
  }
  return (single ? [prefix + '.zip'] : parts).map(name => path.join(directory, name))
}
