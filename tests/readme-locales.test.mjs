import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LOCALE_READMES = [
  'README.zh-CN.md',
  'README.zh-TW.md',
  'README.en.md',
  'README.ja.md',
  'README.ko.md',
  'README.ru.md',
  'README.es.md',
  'README.pt.md',
]

test('each supported language has a standalone README', () => {
  for (const filename of LOCALE_READMES) {
    const filePath = path.join(ROOT, filename)
    assert.ok(fs.existsSync(filePath), `${filename} must exist`)
    const readme = fs.readFileSync(filePath, 'utf8')
    assert.match(readme, /^# Moumusic\s/)
    assert.match(readme, /README\.zh-CN\.md/)
    assert.match(readme, /Moumusic v1\.10\.16/)
  }
})
