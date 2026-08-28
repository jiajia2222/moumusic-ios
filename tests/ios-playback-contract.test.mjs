import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8')

test('iOS registers a native playback bridge with Now Playing metadata and remote commands', () => {
  const pluginPath = path.join(ROOT, 'ios', 'App', 'App', 'BackgroundPlaybackPlugin.swift')
  assert.ok(fs.existsSync(pluginPath), 'BackgroundPlaybackPlugin.swift must exist')
  const plugin = read('ios/App/App/BackgroundPlaybackPlugin.swift')

  assert.match(plugin, /MPNowPlayingInfoCenter/)
  assert.match(plugin, /MPRemoteCommandCenter/)
  assert.match(plugin, /MPMediaItemPropertyArtwork/)
  assert.match(plugin, /lyric/)
  assert.match(plugin, /notifyListeners\("control"/)
  assert.match(plugin, /update\(using: state\)/)
  assert.match(plugin, /contentState: state/)
  assert.match(plugin, /end\(using: nil/)
  assert.doesNotMatch(plugin, /activity\.update\(content\)/)
  assert.doesNotMatch(plugin, /content: content/)

  const bridge = read('ios/App/App/NativeBridgeViewController.swift')
  assert.match(bridge, /registerPluginInstance\(BackgroundPlaybackPlugin\(\)\)/)

  const scene = read('ios/App/App/SceneDelegate.swift')
  assert.match(scene, /NativeBridgeViewController\(\)/)
})

test('iOS declares Live Activities and embeds the Dynamic Island widget target', () => {
  const info = read('ios/App/App/Info.plist')
  assert.match(info, /<key>NSSupportsLiveActivities<\/key>/)

  const widgetPath = path.join(ROOT, 'ios', 'App', 'MoumouLiveActivity', 'MoumouLiveActivityWidget.swift')
  assert.ok(fs.existsSync(widgetPath), 'Live Activity widget source must exist')
  const widget = read('ios/App/MoumouLiveActivity/MoumouLiveActivityWidget.swift')
  assert.match(widget, /ActivityConfiguration/)
  assert.match(widget, /DynamicIsland/)

  const project = read('ios/App/App.xcodeproj/project.pbxproj')
  assert.match(project, /MoumouLiveActivityWidget\.swift in Sources/)
  assert.match(project, /com\.apple\.product-type\.app-extension/)
  assert.match(project, /PlugIns/)
})
