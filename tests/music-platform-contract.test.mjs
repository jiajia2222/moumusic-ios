import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8')

test('native media state carries artwork, album and the current lyric line', () => {
  const source = read('packages/web/src/core/background.ts')
  assert.match(source, /artworkUrl\??: string/)
  assert.match(source, /album\??: string/)
  assert.match(source, /lyric\??: string/)
  assert.match(source, /lyricIndex\??: number/)
})

test('the home recommendation model exposes a selectable source', () => {
  const app = read('packages/web/src/musicApp.ts')
  const ui = read('packages/web/src/ui/AppleUI.tsx')
  assert.match(app, /STORAGE_RECOMMEND_SOURCE/)
  assert.match(app, /recommendSource/)
  assert.match(app, /recommendSources/)
  assert.match(app, /switchRecommendSource/)
  assert.match(ui, /recommendSources/)
  assert.match(ui, /switchRecommendSource/)
})

test('source import accepts common LX Music and MusicFree method names', () => {
  const runner = read('packages/web/src/core/plugin/runner.ts')
  assert.match(runner, /musicSearch/)
  assert.match(runner, /musicUrl/)
  assert.match(runner, /getMusicUrl/)
  assert.match(runner, /musicLyric/)
})

test('source results normalize common LX Music metadata fields', () => {
  const manager = read('packages/web/src/core/plugin/manager.ts')
  assert.match(manager, /normalizeMusicItem/)
  assert.match(manager, /raw\.name/)
  assert.match(manager, /raw\.singer/)
  assert.match(manager, /raw\.pic/)
  assert.match(manager, /raw\.interval/)
})

test('the selected home source also limits search dispatch', () => {
  const app = read('packages/web/src/musicApp.ts')
  assert.match(app, /const searchSource = recommendSourceRef\.current/)
  assert.match(app, /filter\(plugin\s*=>\s*searchSource === 'all' \|\| plugin\.name === searchSource,?\s*\)/)
})
