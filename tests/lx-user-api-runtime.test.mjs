import assert from 'node:assert/strict'
import { createCipheriv, createHash, constants, generateKeyPairSync, publicEncrypt } from 'node:crypto'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const bundle = await esbuild.build({
  stdin: {
    contents: "export { loadLXUserApi } from './packages/web/src/core/plugin/lxUserApi.ts'; export { parseYrc } from './packages/web/src/core/lyrics.ts'",
    resolveDir: ROOT,
    sourcefile: 'lx-user-api-entry.ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'browser',
  write: false,
})
const runtime = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

test('LX User API runtime matches source request, MD5, AES and RSA contracts', async () => {
  const { publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 1024,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  const rsaPayload = new Uint8Array(128)
  rsaPayload[127] = 1
  const expectedRsa = publicEncrypt(
    { key: publicKey, padding: constants.RSA_NO_PADDING },
    Buffer.from(rsaPayload),
  ).toString('base64')

  const key = '123456789abcdefg'
  const iv = '012345678901234a'
  const cipher = createCipheriv('aes-128-cbc', key, iv)
  const expectedAes = Buffer.concat([cipher.update('hello'), cipher.final()]).toString('base64')
  const expectedMd5 = createHash('md5').update(encodeURIComponent('中文')).digest('hex')
  const requests = []
  const fetcher = async (input, init) => {
    requests.push({ input: String(input), init })
    return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const source = `
    /* @id runtime-lx @name Runtime LX @version 1.0.0 */
    lx.on(lx.EVENT_NAMES.request, async ({ source, action, info }) => {
      if (source !== 'kw') throw new Error('wrong source')
      if (action === 'musicUrl') {
        if (info.type !== '320k') throw new Error('wrong quality')
        const body = await new Promise((resolve, reject) => lx.request(
          'https://api.example.test/resolve',
          { method: 'post', form: { id: '1' } },
          (error, response, value) => error ? reject(error) : resolve(value),
        ))
        if (!body.ok) throw new Error('request body was not parsed')
        const digest = lx.utils.crypto.md5('中文')
        const aes = lx.utils.buffer.bufToString(
          lx.utils.crypto.aesEncrypt('hello', 'aes-128-cbc', '${key}', '${iv}'), 'base64',
        )
        const rsa = lx.utils.buffer.bufToString(
          lx.utils.crypto.rsaEncrypt(new Uint8Array(${JSON.stringify(Array.from(rsaPayload))}), ${JSON.stringify(publicKey)}),
          'base64',
        )
        return 'https://media.example.test/song.mp3?md5=' + digest + '&aes=' + aes + '&rsa=' + rsa
      }
      if (action === 'lyric') return { lyric: '[00:01.00]hello', tlyric: '[00:01.00]你好' }
      return 'https://img.example.test/cover.jpg'
    })
    lx.send(lx.EVENT_NAMES.inited, { sources: { kw: { type: 'music', actions: ['musicUrl', 'lyric', 'pic'], qualitys: ['320k'] } } })
  `

  const plugin = runtime.loadLXUserApi(source, fetcher)
  const item = { id: '1', platform: 'Runtime LX', source: 'kw', title: 'Song', artist: 'Artist' }
  const media = await plugin.getMediaSource(item, '320')
  const mediaUrl = new URL(media.url)
  assert.equal(mediaUrl.searchParams.get('md5'), expectedMd5)
  assert.equal(mediaUrl.searchParams.get('aes'), expectedAes)
  assert.equal(mediaUrl.searchParams.get('rsa'), expectedRsa)
  assert.equal(requests.length, 1)
  assert.match(requests[0].input, /method=POST/)
  assert.equal(requests[0].init.method, 'POST')
  assert.equal(requests[0].init.body, 'id=1')
  assert.deepEqual(await plugin.getLyric(item), { lyric: '[00:01.00]hello', tlyric: '[00:01.00]你好' })

  const lxWords = runtime.parseYrc('[00:01.00]hello<0,500> world<500,500>')
  assert.equal(lxWords[0].text, 'hello world')
  assert.deepEqual(lxWords[0].words?.map(word => [word.text, word.start, word.duration]), [
    ['hello', 1, 0.5], [' world', 1.5, 0.5],
  ])
})
