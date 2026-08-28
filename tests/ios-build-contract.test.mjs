import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('iOS build entry is available and uses the Capacitor iOS platform', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))

  assert.equal(pkg.dependencies['@capacitor/ios'], '^8.5.0')
  assert.equal(pkg.scripts['build:ipa'], 'node scripts/build-ipa.mjs')
  assert.ok(fs.existsSync(path.join(ROOT, 'scripts', 'build-ipa.mjs')))
})

test('iOS app declares the audio background mode', () => {
  const info = fs.readFileSync(path.join(ROOT, 'ios', 'App', 'App', 'Info.plist'), 'utf8')

  assert.match(info, /<key>UIBackgroundModes<\/key>/)
  assert.match(info, /<string>audio<\/string>/)
})

test('generated iOS web assets stay out of version control', () => {
  const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')

  assert.match(gitignore, /ios\/App\/App\/public\//)
  assert.match(gitignore, /ios\/App\/App\/capacitor\.config\.json/)
})
