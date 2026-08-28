/**
 * Build an unsigned iOS IPA from the Capacitor web app.
 *
 * This intentionally uses CODE_SIGNING_ALLOWED=NO. The resulting IPA is useful
 * for inspection, CI artifacts, or a later signing step; iOS will not install it
 * on a device until it is signed with a provisioning profile.
 *
 * Usage:
 *   pnpm build:ipa
 *
 * Xcode is required. The script exits with an actionable message on non-macOS
 * hosts instead of failing later with a confusing missing-tool error.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { buildStamp } from './build-stamp.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'packages', 'web', 'dist')
const IOS = path.join(ROOT, 'ios')
const PROJECT = path.join(IOS, 'App', 'App.xcodeproj')
const BUILD_ROOT = path.join(IOS, 'build')
const DERIVED_DATA = path.join(BUILD_ROOT, 'DerivedData')
const OUTPUT_DIR = path.join(BUILD_ROOT, 'unsigned')
const APP_PATH = path.join(DERIVED_DATA, 'Build', 'Products', 'Release-iphoneos', 'App.app')
const IPA_PATH = path.join(OUTPUT_DIR, 'Moumusic-unsigned.ipa')

const fail = (message) => {
  console.error(`✘ ${message}`)
  process.exit(1)
}

if (process.platform !== 'darwin') {
  fail('iOS IPA 建置需要 macOS + Xcode；当前主机不是 macOS。代码与 iOS 工程已就绪，请在 Mac 上运行 pnpm build:ipa。')
}

if (!fs.existsSync(PROJECT)) {
  fail('找不到 ios/App/App.xcodeproj，请先运行 pnpm exec cap add ios。')
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const run = (command, args, cwd = ROOT) => execFileSync(command, args, {
  cwd,
  stdio: 'inherit',
  env: process.env,
})

console.log(`▸ 建置戳记：${buildStamp()}`)

// 1) Build the web bundle. The generated assets are the only content copied into
// the native shell, so do this before cap sync.
run(pnpm, ['--filter', '@whymusic/web', 'build'])

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  fail('packages/web/dist 缺少 index.html')
}
for (const dir of ['sources', 'plugins']) {
  if (fs.existsSync(path.join(DIST, dir))) {
    fail(`dist/${dir}/ 存在 —— 本项目不随附音源，不能把它打进 IPA`)
  }
}

// 2) Sync Capacitor. This is deliberately run on every build so the generated
// Swift Package paths are rewritten for the current host (POSIX paths on macOS).
run(pnpm, ['exec', 'cap', 'sync', 'ios'])

// 3) Build an arm64 device app with every signing switch disabled. Capacitor
// 8.5 gates its Swift APIs behind the NonescapableTypes compiler feature. Keep
// Swift 5 language compatibility for older third-party sources while enabling
// that feature explicitly.
fs.rmSync(DERIVED_DATA, { recursive: true, force: true })
fs.rmSync(OUTPUT_DIR, { recursive: true, force: true })
run('xcodebuild', [
  '-project', PROJECT,
  '-scheme', 'App',
  '-configuration', 'Release',
  '-sdk', 'iphoneos',
  '-destination', 'generic/platform=iOS',
  '-derivedDataPath', DERIVED_DATA,
  'SWIFT_VERSION=5.0',
  'OTHER_SWIFT_FLAGS=-enable-experimental-feature NonescapableTypes',
  'CODE_SIGNING_ALLOWED=NO',
  'CODE_SIGNING_REQUIRED=NO',
  'CODE_SIGN_IDENTITY=',
  'build',
])

if (!fs.existsSync(APP_PATH)) {
  fail(`xcodebuild 完成但找不到 ${path.relative(ROOT, APP_PATH)}`)
}

// 4) IPA is a zip with Payload/App.app at its root.
const payload = path.join(OUTPUT_DIR, 'Payload')
fs.mkdirSync(payload, { recursive: true })
fs.cpSync(APP_PATH, path.join(payload, 'App.app'), { recursive: true })
run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', payload, IPA_PATH])
fs.rmSync(payload, { recursive: true, force: true })

const mb = (fs.statSync(IPA_PATH).size / 1024 / 1024).toFixed(2)
console.log(`\n✓ ${path.relative(ROOT, IPA_PATH)} (${mb} MiB, unsigned)`)
console.log('  未签名 IPA 不能直接安装到 iPhone；需要在后续步骤使用证书与 provisioning profile 签名。')
