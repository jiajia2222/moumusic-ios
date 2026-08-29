import test from 'node:test'
import assert from 'node:assert/strict'
import {
  lyricKumoneNetease,
  resolveKumoneUnblock,
  searchKumoneNetease,
} from '../packages/web/shared/kumone.js'

const jsonResponse = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'content-type': 'application/json' },
})

test('Kumone fallback uses provider-owned Kugou resolver when GD has no URL', async () => {
  const calls = []
  const fetcher = async (url) => {
    calls.push(url)
    if (url.includes('music-api.gdstudio.xyz')) return jsonResponse({ url: '', br: 0 })
    if (url.includes('mobilecdn.kugou.com')) {
      return jsonResponse({ data: { info: [{ hash: 'abc123', album_id: '42', duration: 223 }] } })
    }
    if (url.includes('trackercdn.kugou.com')) {
      return jsonResponse({ url: ['http://cdn.example.test/song.mp3'] })
    }
    throw new Error(`unexpected URL: ${url}`)
  }

  const result = await resolveKumoneUnblock({
    id: '186016', title: '晴天', artist: '周杰伦', duration: 223,
  }, fetcher)

  assert.deepEqual(result, {
    url: 'https://cdn.example.test/song.mp3',
    source: 'kugou',
    id: 'abc123',
  })
  assert.equal(calls.filter(url => url.includes('trackercdn.kugou.com')).length, 1)
})

test('standalone fallback resolves the legacy GD Joox source too', async () => {
  const fetcher = async (url) => {
    if (url.includes('types=url&source=netease')) return jsonResponse({ url: '', br: 0 })
    if (url.includes('types=search&source=joox')) {
      return jsonResponse([{ id: 'joox-id', name: '晴天', artist: ['周杰倫'] }])
    }
    if (url.includes('types=url&source=joox')) {
      return jsonResponse({ url: 'http://cdn.example.test/joox.mp3', br: 320 })
    }
    throw new Error(`unexpected URL: ${url}`)
  }

  const result = await resolveKumoneUnblock({
    id: '186016', title: '晴天', artist: '周杰伦', duration: 269,
  }, fetcher)

  assert.deepEqual(result, {
    url: 'https://cdn.example.test/joox.mp3',
    source: 'joox',
    id: 'joox-id',
  })
})

test('Kumone NetEase search posts an encrypted eapi request and maps no stale GD data', async () => {
  let request
  const songs = [{ id: 186016, name: '晴天', ar: [{ name: '周杰伦' }], al: { name: '叶惠美' } }]
  const fetcher = async (url, init) => {
    request = { url, init }
    return jsonResponse({ code: 200, result: { songs } })
  }

  const result = await searchKumoneNetease('晴天 周杰伦', 1, 30, fetcher)

  assert.equal(result[0].id, 186016)
  assert.match(request.url, /interface\.music\.163\.com\/eapi\/cloudsearch\/pc/)
  assert.equal(request.init.method, 'POST')
  assert.match(String(request.init.body), /^params=[A-F0-9%]+$/)
})

test('Kumone lyric boundary normalizes NetEase JSONL lyric payloads to LRC', async () => {
  const fetcher = async () => jsonResponse({
    code: 200,
    lrc: { lyric: '{"t":1000,"c":[{"tx":"第一句"}]}\n{"t":2500,"c":[{"tx":"第二句"}]}' },
  })

  const result = await lyricKumoneNetease('186016', fetcher)

  assert.equal(result.lyric, '[00:01.000]第一句\n[00:02.500]第二句')
})
