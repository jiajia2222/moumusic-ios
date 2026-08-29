import CryptoJS from 'crypto-js'

/**
 * Shared pieces of Kumone's NetEase and UnblockService flow.
 *
 * This module is deliberately transport-agnostic. The web worker and the
 * self-hosted Node server pass their own fetch implementation, while the
 * native app passes pluginFetch so requests can escape WebView CORS.
 */

const NETEASE_EAPI_KEY = 'e82ckenh8dichen8'
const NETEASE_WEAPI_PRESET_KEY = '0CoJUm6Qyw8W8jud'
const NETEASE_WEAPI_IV = '0102030405060708'
const NETEASE_WEAPI_SECRET_KEY = 'kumone2026abcDEF'
const NETEASE_WEAPI_ENC_SEC_KEY =
  '38cef2efdbcc1cfd6a44d81620dae5d23091f50ef27e01a1b1bb7e998e0fde2d' +
  '7ab6002a9e79a3c195f661cbde80e21e6245997b11b54d28407115822f95d447' +
  '7cc06b5a77de46fab6568410abf1229abef81b4c8588f386149010d190bb0b04' +
  'f064be330bd877a4d4b99514febbdb4335b10744b13d9f7ee24d314d6e62cdc9'

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

const fetchWith = (fetcher) => fetcher || fetch

const randomRequestId = () => String(20_000_000 + Math.floor(Math.random() * 10_000_000))

const neteaseHeader = () => ({
  os: 'pc',
  appver: '3.1.17',
  osver: 'Version 14.0 (Build 23A344)',
  deviceId: 'kumone',
  requestId: randomRequestId(),
  clientSign: '',
  versioncode: '140',
  buildver: String(Math.floor(Date.now() / 1000)),
  resolution: '1920x1080',
  channel: '',
})

const aesCbc = (text, key, iv) => CryptoJS.AES.encrypt(
  CryptoJS.enc.Utf8.parse(text),
  CryptoJS.enc.Utf8.parse(key),
  {
    iv: CryptoJS.enc.Utf8.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  },
).toString()

const eapiParams = (apiPath, payload) => {
  const text = JSON.stringify({ ...payload, header: payload.header || neteaseHeader() })
  const digest = CryptoJS.MD5(`nobody${apiPath}use${text}md5forencrypt`).toString()
  const input = `${apiPath}-36cd479b6b5-${text}-36cd479b6b5-${digest}`
  const ciphertext = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(input),
    CryptoJS.enc.Utf8.parse(NETEASE_EAPI_KEY),
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 },
  ).ciphertext.toString(CryptoJS.enc.Hex).toUpperCase()
  return `params=${encodeURIComponent(ciphertext)}`
}

const weapiParams = (payload) => {
  const text = JSON.stringify({ ...payload, csrf_token: payload.csrf_token || '' })
  const first = aesCbc(text, NETEASE_WEAPI_PRESET_KEY, NETEASE_WEAPI_IV)
  const second = aesCbc(first, NETEASE_WEAPI_SECRET_KEY, NETEASE_WEAPI_IV)
  return `params=${encodeURIComponent(second)}&encSecKey=${NETEASE_WEAPI_ENC_SEC_KEY}`
}

const parseJsonResponse = async (response, label) => {
  const body = await response.text()
  if (!response.ok) throw new Error(`${label} HTTP ${response.status}`)
  let data
  try {
    data = JSON.parse(body)
  } catch {
    throw new Error(`${label} returned non-JSON data`)
  }
  if (Number.isInteger(data?.code) && data.code !== 200) {
    throw new Error(`${label} API error ${data.code}: ${data.message || data.msg || ''}`.trim())
  }
  return data
}

/** POST an encrypted request using the same eapi contract as Kumone. */
export async function kumoneNeteaseEapi(path, payload, fetcher) {
  const request = fetchWith(fetcher)
  const apiPath = `/api${path}`
  const response = await request(`https://interface.music.163.com/eapi${path}`, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      Referer: 'https://music.163.com',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: eapiParams(apiPath, payload),
  })
  return parseJsonResponse(response, 'NetEase eapi')
}

/** POST an encrypted request using the same weapi contract as Kumone. */
export async function kumoneNeteaseWeapi(path, payload, fetcher) {
  const request = fetchWith(fetcher)
  const response = await request(`https://music.163.com/weapi${path}`, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      Referer: 'https://music.163.com',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: weapiParams(payload),
  })
  return parseJsonResponse(response, 'NetEase weapi')
}

/** NetEase song search used by Kumone instead of the stale GD search mirror. */
export async function searchKumoneNetease(query, page = 1, limit = 30, fetcher) {
  const root = await kumoneNeteaseEapi('/cloudsearch/pc', {
    s: query,
    type: 1,
    limit,
    offset: Math.max(0, page - 1) * limit,
    total: true,
  }, fetcher)
  return Array.isArray(root?.result?.songs) ? root.result.songs : []
}

/** Convert a NetEase Track shape to the app's canonical music item. */
export function normalizeKumoneNeteaseTrack(raw) {
  const artists = raw?.ar || raw?.artists || []
  const album = raw?.al || raw?.album || {}
  const artist = Array.isArray(artists)
    ? artists.map(item => typeof item === 'string' ? item : item?.name).filter(Boolean).join(' / ')
    : String(artists || '')
  const id = String(raw?.id || '')
  return {
    id,
    title: String(raw?.name || raw?.title || ''),
    artist,
    album: String(album?.name || (typeof album === 'string' ? album : '')),
    artwork: String(album?.picUrl || album?.pic_str || raw?.artwork || ''),
    duration: Number(raw?.dt || raw?.duration || 0) > 10000
      ? Number(raw?.dt || raw?.duration || 0) / 1000
      : Number(raw?.dt || raw?.duration || 0),
    subSource: 'netease',
    picId: String(album?.pic_str || album?.pic || id || ''),
    lyricId: id,
    type: 'music',
  }
}

const lyricText = (object, key) => String(object?.[key]?.lyric || '')

// NetEase's current `/song/lyric/v1` sometimes puts word-timed JSONL in
// `lrc.lyric` instead of ordinary LRC. The app parser intentionally accepts
// LRC/YRC, so normalize that response at the source boundary.
const normalizeLyricText = (value) => {
  const text = String(value || '')
  if (!text.trim().startsWith('{')) return text
  const lines = []
  for (const rawLine of text.split(/\r?\n/)) {
    try {
      const line = JSON.parse(rawLine)
      const timestamp = Number(line?.t)
      const words = Array.isArray(line?.c)
        ? line.c.map(word => String(word?.tx || '')).join('')
        : String(line?.text || '')
      if (!words || !Number.isFinite(timestamp)) continue
      const seconds = Math.max(0, timestamp / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainder = (seconds % 60).toFixed(3).padStart(6, '0')
      lines.push(`[${String(minutes).padStart(2, '0')}:${remainder}]${words}`)
    } catch {
      // Preserve no malformed JSONL line; valid ordinary lines are handled above.
    }
  }
  return lines.join('\n')
}

/** Get plain/translated/romanized lyrics through Kumone's NetEase path. */
export async function lyricKumoneNetease(id, fetcher) {
  const payload = { id: Number(id) || 0, cp: false, lv: 0, kv: 0, tv: 0, rv: 0, yv: 0, ytv: 0, yrv: 0 }
  try {
    const first = await kumoneNeteaseWeapi('/song/lyric/v1', payload, fetcher)
    if (lyricText(first, 'lrc') || lyricText(first, 'yrc')) {
      return {
        lyric: normalizeLyricText(lyricText(first, 'lrc')),
        tlyric: normalizeLyricText(lyricText(first, 'tlyric')),
        rlyric: normalizeLyricText(lyricText(first, 'romalrc')),
        yrc: lyricText(first, 'yrc'),
      }
    }
  } catch {
    // The classic endpoint below is the same fallback used by Kumone.
  }
  const classic = await kumoneNeteaseWeapi('/song/lyric', {
    id: Number(id) || 0, lv: -1, kv: -1, tv: -1, rv: -1,
  }, fetcher)
  return {
    lyric: normalizeLyricText(lyricText(classic, 'lrc')),
    tlyric: normalizeLyricText(lyricText(classic, 'tlyric')),
    rlyric: normalizeLyricText(lyricText(classic, 'romalrc')),
    yrc: lyricText(classic, 'yrc'),
  }
}

const json = async (request, url, label) => parseJsonResponse(
  await request(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } }),
  label,
)

const textResponse = async (request, url, label, headers = {}) => {
  const response = await request(url, {
    headers: { 'User-Agent': USER_AGENT, ...headers },
  })
  if (!response.ok) throw new Error(`${label} HTTP ${response.status}`)
  return await response.text()
}

const durationMsOf = (value) => {
  const duration = Number(value) || 0
  return duration > 10_000 ? duration : duration * 1000
}

const selectMatch = (list, targetDurationMs, durationOf) => {
  const top = list.slice(0, 5)
  if (targetDurationMs > 0) {
    const match = top.find(item => {
      const duration = durationOf(item)
      return duration > 0 && Math.abs(duration - targetDurationMs) < 5000
    })
    if (match) return match
  }
  return top[0]
}

const keywordOf = ({ title = '', artist = '' }) => `${title} ${artist}`.trim()

const pyncmd = async ({ id, bitrate }, request, gdApi) => {
  if (!id) return null
  const query = new URLSearchParams({ types: 'url', source: 'netease', id: String(id), br: String(bitrate || 320) })
  const data = await json(request, `${gdApi}?${query}`, 'GD pyncmd')
  const url = String(data?.url || '').replace(/^http:/, 'https:')
  return Number(data?.br) > 0 && url ? { url, source: 'pyncmd', id: String(id) } : null
}

const providerName = (value) => String(value || '')
  .toLowerCase()
  .replace(/[（([【].*?[)）\]】]/g, '')
  .replace(/[\s\-_·・,，.。!！?？'"、/\\|&+]/g, '')

const joox = async (track, request, gdApi) => {
  const query = new URLSearchParams({
    types: 'search',
    source: 'joox',
    name: keywordOf(track),
    count: '10',
    pages: '1',
  })
  const root = await json(request, `${gdApi}?${query}`, 'GD Joox search')
  const list = Array.isArray(root) ? root : Array.isArray(root?.data) ? root.data : []
  if (!list.length) return null
  const targetTitle = providerName(track.title)
  const exactTitle = list.find(item => providerName(item?.name || item?.title) === targetTitle)
  const match = exactTitle || list[0]
  const id = String(match?.url_id || match?.id || '')
  if (!id) return null
  const urlQuery = new URLSearchParams({ types: 'url', source: 'joox', id, br: '320' })
  const resolved = await json(request, `${gdApi}?${urlQuery}`, 'GD Joox url')
  const url = String(resolved?.url || '').replace(/^http:/, 'https:')
  return url ? { url, source: 'joox', id } : null
}

const kugou = async (track, request) => {
  const query = encodeURIComponent(keywordOf(track))
  const searchUrl = `http://mobilecdn.kugou.com/api/v3/search/song?format=json&keyword=${query}&page=1&pagesize=10`
  const root = await json(request, searchUrl, 'Kugou search')
  const list = Array.isArray(root?.data?.info) ? root.data.info : []
  const match = selectMatch(list, durationMsOf(track.duration), item => Number(item?.duration || 0) * 1000)
  if (!match?.hash) return null
  const hash = String(match.hash)
  const key = CryptoJS.MD5(`${hash}kgcloudv2`).toString()
  const trackerUrl = 'https://trackercdn.kugou.com/i/v2/?'
    + new URLSearchParams({
      key,
      hash,
      appid: '1005',
      pid: '2',
      cmd: '25',
      behavior: 'play',
      album_id: String(match.album_id || '0'),
    })
  const resolved = await json(request, trackerUrl, 'Kugou tracker')
  const url = String(Array.isArray(resolved?.url) ? resolved.url[0] || '' : '')
    .replace(/^http:/, 'https:')
  return url ? { url, source: 'kugou', id: hash } : null
}

const kuwo = async (track, request) => {
  const query = encodeURIComponent(keywordOf(track))
  const searchUrl = 'https://search.kuwo.cn/r.s?&correct=1&vipver=1&stype=comprehensive&encoding=utf8'
    + `&rformat=json&mobi=1&show_copyright_off=1&searchapi=6&all=${query}`
  const root = await json(request, searchUrl, 'Kuwo search')
  const content = Array.isArray(root?.content) ? root.content : []
  const list = content[1]?.musicpage?.abslist
  if (!Array.isArray(list)) return null
  const match = selectMatch(list, durationMsOf(track.duration), item => Number(item?.DURATION || 0) * 1000)
  const musicRid = String(match?.MUSICRID || '')
  const rid = musicRid.includes('_') ? musicRid.split('_').pop() : musicRid
  if (!rid) return null
  const convertUrl = 'https://antiserver.kuwo.cn/anti.s?'
    + new URLSearchParams({ type: 'convert_url', format: 'mp3', response: 'url', rid: `MUSIC_${rid}` })
  const body = await textResponse(request, convertUrl, 'Kuwo convert', { 'User-Agent': 'okhttp/3.10.0' })
  const matchUrl = body.match(/https?:[^\s$\"]+/)?.[0] || ''
  return matchUrl ? { url: matchUrl, source: 'kuwo', id: rid } : null
}

/**
 * Kumone's real gray-track providers plus the legacy GD/Joox source used by
 * this app. The Joox step is needed by standalone native builds because they
 * do not have the web worker's existing WHY_SOURCES route to resolve it.
 * `exclude` contains source names already proven unusable by the player.
 */
export async function resolveKumoneUnblock({ id = '', title = '', artist = '', duration = 0, bitrate = 320, exclude = [] }, fetcher, gdApi = 'https://music-api.gdstudio.xyz/api.php') {
  const request = fetchWith(fetcher)
  const skip = new Set((Array.isArray(exclude) ? exclude : []).map(String))
  const track = { id: String(id), title: String(title), artist: String(artist), duration: Number(duration) || 0 }
  if (!skip.has('pyncmd') && !skip.has('netease')) {
    try {
      const direct = await pyncmd({ id: track.id, bitrate }, request, gdApi)
      if (direct) return direct
    } catch {
      // Continue with the actual Kumone providers.
    }
  }
  if (!keywordOf(track)) return null
  if (!skip.has('joox')) {
    try {
      const direct = await joox(track, request, gdApi)
      if (direct) return direct
    } catch {
      // Keep trying the provider-owned Kumone fallbacks.
    }
  }
  if (!skip.has('kugou')) {
    try {
      const direct = await kugou(track, request)
      if (direct) return direct
    } catch {
      // A provider can be region-limited; try the next one.
    }
  }
  if (!skip.has('kuwo')) {
    try {
      const direct = await kuwo(track, request)
      if (direct) return direct
    } catch {
      // No playable result from this provider.
    }
  }
  return null
}
