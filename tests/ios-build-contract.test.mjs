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

test('release workflow builds on macOS and uploads the unsigned IPA', () => {
  const workflowPath = path.join(ROOT, '.github', 'workflows', 'ios-release.yml')
  assert.ok(fs.existsSync(workflowPath), 'iOS release workflow must exist')
  const workflow = fs.readFileSync(workflowPath, 'utf8')

  assert.match(workflow, /runs-on:\s*macos-/)
  assert.match(workflow, /runs-on:\s*macos-26/)
  assert.match(workflow, /pnpm build:ipa/)
  assert.match(workflow, /gh release create/)
  assert.match(workflow, /ios\/build\/unsigned\/Moumou-unsigned\.ipa/)

  const buildScript = fs.readFileSync(path.join(ROOT, 'scripts', 'build-ipa.mjs'), 'utf8')
  assert.match(buildScript, /SWIFT_VERSION=5\.0/)
  assert.match(buildScript, /NonescapableTypes/)
})

test('Capacitor Share is patched for the Capacitor 8.5 Swift API', () => {
  const patchesDir = path.join(ROOT, 'patches')
  assert.ok(fs.existsSync(patchesDir), 'dependency patches directory must exist')
  const patchName = fs.readdirSync(patchesDir).find(
    name => name.includes('share') && name.includes('8.0.1') && name.endsWith('.patch'),
  )
  assert.ok(patchName, 'a patch for @capacitor/share@8.0.1 must exist')

  const patch = fs.readFileSync(path.join(patchesDir, patchName), 'utf8')
  assert.match(patch, /getString\("text", ""\)/)
  assert.match(patch, /unavailable\("Must provide at least url, text or files"\)/)
  assert.match(patch, /\+import UIKit/)
  assert.match(patch, /\+.*connectedScenes/)
  assert.match(patch, /\+.*presenter\.present\(/)
  assert.doesNotMatch(patch, /\+.*bridge\?\.viewController/)
})
