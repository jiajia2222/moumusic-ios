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
  const native = read('packages/web/src/core/native.ts')
  assert.match(runner, /musicSearch/)
  assert.match(runner, /musicUrl/)
  assert.match(runner, /getMusicUrl/)
  assert.match(runner, /musicLyric/)
  assert.match(runner, /isLXUserApiCode/)
  assert.match(read('packages/web/src/core/plugin/lxUserApi.ts'), /EVENT_NAMES/)
  assert.match(native, /viaProxy\(url: string, method = 'GET'\)/)
  assert.match(read('packages/web/src/core/plugin/lxUserApi.ts'), /viaProxy\(url, method\)/)
})

test('lyrics keep LX/Kumone translation and word-timing layers', () => {
  const lyrics = read('packages/web/src/core/lyrics.ts')
  assert.match(lyrics, /parseYrc/)
  assert.match(lyrics, /parseLyricResponse/)
  assert.match(lyrics, /translation\?: string/)
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

test('clean installs do not register a bundled source, while user sources stay compatible', () => {
  const app = read('packages/web/src/musicApp.ts')
  const ui = read('packages/web/src/ui/AppleUI.tsx')
  const source = read('packages/web/src/core/plugin/kumone.ts')
  assert.doesNotMatch(app, /createKumonePlugin/)
  assert.doesNotMatch(app, /createLXKuwoPlugin/)
  assert.match(app, /readCachedPlugins/)
  assert.match(ui, /首頁推薦/)
  assert.match(ui, /switchRecommendSource/)
  assert.match(ui, /switchRecommendCategory/)
  assert.match(app, /標準 · 128 kbps/)
  assert.match(app, /無損 · FLAC/)
  assert.match(source, /Kumone \/ NetEase/)
  assert.match(source, /\/api\/why-search/)
  assert.match(source, /\/api\/why-url/)
  assert.match(source, /music-api\.gdstudio\.xyz\/api\.php/)
  assert.match(source, /resolveKumoneUnblock/)
  assert.match(read('packages/web/shared/kumone.js'), /trackercdn\.kugou\.com/)
  assert.match(read('packages/web/shared/kumone.js'), /antiserver\.kuwo\.cn/)
  assert.match(read('packages/web/worker/why.js'), /searchKumoneNetease/)
})
