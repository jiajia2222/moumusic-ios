import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8')

test('the player exposes a queue snapshot for the full now-playing page', () => {
  const app = read('packages/web/src/musicApp.ts')
  assert.match(app, /const \[queueState, setQueueState\]/)
  assert.match(app, /queueState,/)
})

test('the UI has a full now-playing page with lyrics and queue modes', () => {
  const ui = read('packages/web/src/ui/AppleUI.tsx')
  assert.match(ui, /function NowPlayingSheet\(/)
  assert.match(ui, /queueItems/)
  assert.match(ui, /歌詞|lyrics/)
  assert.match(ui, /佇列|queue/)
  assert.match(ui, /onToggleFavorite/)
})

test('liquid glass tokens are used across the app shell', () => {
  const css = read('packages/web/src/index.css')
  assert.match(css, /\.wm-glass\s*\{/)
  assert.match(css, /\.wm-liquid-orb\s*\{/)
  assert.match(css, /\.wm-now-playing\s*\{/)
})

test('playback preserves source headers when routing audio through the web proxy', () => {
  const player = read('packages/web/src/core/player/player.ts')
  const app = read('packages/web/src/musicApp.ts')
  const native = read('packages/web/src/core/native.ts')
  const worker = read('packages/web/worker/index.js')
  assert.match(player, /play\(url: string, options\?/) 
  assert.match(app, /player\.play\(media\.url, \{ headers: media\.headers/) 
  assert.match(native, /headers\?: Record<string, string>/)
  assert.match(worker, /searchParams\.get\('referer'\)/)
  assert.match(app, /pluginFetch\(/)
  assert.match(app, /viaProxy\(media\.url, 'GET', media\.headers\)/)
  assert.match(app, /__moumusicBinary: true/)
})
