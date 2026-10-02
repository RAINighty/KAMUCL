const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path')
const collect = require('../scripts/release-history-assets.cjs')
function fixture(names, run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kamu-history-assets-'))
  try { for (const name of names) fs.writeFileSync(path.join(directory, name), ''); run(directory) }
  finally { assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir())); fs.rmSync(directory, {recursive: true, force: true}) }
}
test('release includes every contiguous historical ZIP part in order, excludes other versions and evidence', () => {
  fixture(['KAMUCL-1.1.9-validation-history-part002.zip', 'KAMUCL-1.1.9-validation-history-part001.zip', 'KAMUCL-1.1.8-validation-history.zip', 'private.zip'], directory => {
    assert.deepEqual(collect(directory, '1.1.9').map(file => path.basename(file)), ['KAMUCL-1.1.9-validation-history-part001.zip', 'KAMUCL-1.1.9-validation-history-part002.zip'])
  })
})
test('release refuses missing historical parts, invalid part names and ambiguous single-plus-parts', () => {
  for (const names of [
    ['KAMUCL-1.1.9-validation-history-part002.zip'],
    ['KAMUCL-1.1.9-validation-history-part001.zip', 'KAMUCL-1.1.9-validation-history-part003.zip'],
    ['KAMUCL-1.1.9-validation-history-partBAD.zip'],
    ['KAMUCL-1.1.9-validation-history.zip', 'KAMUCL-1.1.9-validation-history-part001.zip']
  ]) fixture(names, directory => assert.throws(() => collect(directory, '1.1.9')))
})
test('release retains the single historical archive convention and permits no optional history', () => {
  fixture(['KAMUCL-1.1.9-validation-history.zip'], directory => assert.deepEqual(collect(directory, '1.1.9'), [path.join(directory, 'KAMUCL-1.1.9-validation-history.zip')]))
  fixture([], directory => assert.deepEqual(collect(directory, '1.1.9'), []))
})
