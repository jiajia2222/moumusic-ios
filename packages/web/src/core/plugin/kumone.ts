import { isNative, viaProxy } from '../native'
import { MusicItem, Plugin, SearchType } from '../types'
import { pluginFetch } from './runner'

/**
 * Kumone-compatible first-party source.
 *
 * The browser path uses the existing WhyMusic worker routes, which provide the
 * same NetEase/GD search, lyric, artwork and fallback resolution that Kumone
 * uses in its native client. The iOS path calls the GD API through the native
 * URLSession bridge because an IPA has no local worker. This keeps the provider
 * useful in both the web frontend + backend deployment and the standalone app.
 */

const GD_API = 'https://music-api.gdstudio.xyz/api.php'
const SOURCE_ORDER = ['netease', 'kuwo', 'kugou']

const bitrateOf = (quality?: string): number => {
  const value = Number.parseInt(String(quality || '320'), 10)
  return Number.isFinite(value) && value > 0 ? value : 320
}

const text = (value: unknown): string => typeof value === 'string' ? value : ''

const requestJson = async (url: string, init?: RequestInit): Promise<any> => {
  const response = await pluginFetch(viaProxy(url, init?.method || 'GET'), init)
  const body = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  try { return JSON.parse(body) } catch { return body }
}

const gdRequest = (types: string, params: Record<string, string | number>) => (
  requestJson(`${GD_API}?${new URLSearchParams({ types, ...Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  ) }).toString()}`)
)

const normalizeName = (value: unknown): string => String(value || '')
  .toLowerCase()
  .replace(/[（(【\[].*?[)）】\]]/g, '')
  .replace(/[\s\-_·・,，.。!！?？'"、/\\|&+]/g, '')

const artistName = (value: any): string => Array.isArray(value)
  ? value.filter(Boolean).join(' / ')
  : String(value || '')

const sameSong = (candidate: MusicItem, target: MusicItem): boolean => {
  const candidateTitle = normalizeName(candidate.title)
  const targetTitle = normalizeName(target.title)
  const candidateArtist = normalizeName(candidate.artist)
  const targetArtist = normalizeName(target.artist)
  return !!candidateTitle && !!targetTitle
    && (candidateTitle === targetTitle
      || candidateTitle.startsWith(targetTitle)
      || targetTitle.startsWith(candidateTitle))
    && (!targetArtist || !candidateArtist
      || candidateArtist.includes(targetArtist)
      || targetArtist.includes(candidateArtist))
}

const normalizeGdItem = (raw: any, fallbackSource = 'netease'): MusicItem => ({
  id: String(raw?.url_id || raw?.id || ''),
  title: String(raw?.name || raw?.title || ''),
  artist: artistName(raw?.artist || raw?.artists),
  album: String(raw?.album || ''),
  artwork: text(raw?.pic || raw?.pic_url || raw?.artwork),
  platform: 'Kumone / NetEase',
  subSource: String(raw?.source || fallbackSource),
  picId: raw?.pic_id ? String(raw.pic_id) : '',
  lyricId: raw?.lyric_id ? String(raw.lyric_id) : '',
  duration: Number(raw?.duration || raw?.interval || 0),
  type: 'music',
})

const backendOrGd = async (backendPath: string, types: string, params: Record<string, string | number>) => {
  if (!isNative()) return requestJson(backendPath)
  return gdRequest(types, params)
}

const nativeUrl = async (item: MusicItem, quality?: string): Promise<any> => {
  const bitrate = bitrateOf(quality)
  for (const source of SOURCE_ORDER) {
    try {
      const direct = await gdRequest('url', {
        source,
        id: source === 'netease' ? item.id : '',
        br: bitrate,
      })
      const directUrl = text(direct?.url)
      if (directUrl) return { url: directUrl, source, id: item.id }
    } catch {
      // Try the next Kumone fallback source.
    }
  }

  const keyword = `${item.title || ''} ${item.artist || ''}`.trim()
  if (!keyword) return null
  for (const source of SOURCE_ORDER.slice(1)) {
    try {
      const search = await gdRequest('search', { source, name: keyword, count: 5, pages: 1 })
      const candidates = Array.isArray(search) ? search.map(raw => normalizeGdItem(raw, source)) : []
      const match = candidates.find(candidate => sameSong(candidate, item))
      if (!match?.id) continue
      const resolved = await gdRequest('url', { source, id: match.id, br: bitrate })
      if (text(resolved?.url)) return { url: resolved.url, source, id: match.id }
    } catch {
      // Continue through the same fallback order as Kumone's UnblockService.
    }
  }
  return null
}

export function createKumonePlugin(): Plugin {
  return {
    platform: 'Kumone / NetEase',
    name: 'Kumone / NetEase',
    version: '1.0.0',
    description: 'Kumone-compatible NetEase search, lyrics and multi-source playback',
    instance: { builtin: true, kumone: true, sourceId: 'netease' },
    supportedMethods: new Set(['search', 'getMediaSource', 'getLyric', 'getMusicArtwork']),

    async search(query, page = 1, type: SearchType = 'music') {
      if (type !== 'music') return { data: [], isEnd: true }
      if (isNative() && typeof window !== 'undefined' && window.KumoneSource) {
        const result = await window.KumoneSource.search({ query, page, limit: 30 })
        const list = Array.isArray(result?.data) ? result.data : []
        const data = list.map(raw => normalizeGdItem(raw, 'netease'))
        return { data, isEnd: result?.isEnd ?? data.length < 30 }
      }
      const result = await backendOrGd(
        `/api/why-search?q=${encodeURIComponent(query)}&type=music&page=${page}&count=30`,
        'search',
        { source: 'netease', name: query, count: 30, pages: page },
      )
      const list = Array.isArray(result) ? result : result?.data
      const data = Array.isArray(list)
        ? list.map(raw => normalizeGdItem(raw, raw?.source || 'netease'))
        : []
      return { data, isEnd: data.length < 30 }
    },

    async getMediaSource(item, quality) {
      const bitrate = bitrateOf(quality)
      const source = String(item.subSource || (item as any).source || 'netease')
      if (!isNative()) {
        const query = new URLSearchParams({
          id: String(item.id || ''),
          source,
          br: String(bitrate),
          title: String(item.title || ''),
          artist: String(item.artist || ''),
          exclude: Array.isArray(item._exclude) ? item._exclude.join(',') : '',
        })
        const result = await requestJson(`/api/why-url?${query.toString()}`)
        if (text(result?.url)) return { url: result.url, source: result.source || source, quality }
        throw new Error('Kumone 没有返回可播放地址')
      }

      if (typeof window !== 'undefined' && window.KumoneSource) {
        try {
          const native = await window.KumoneSource.media({ id: String(item.id || ''), quality })
          if (text(native?.url)) {
            return {
              url: native.url!,
              source: native.source || 'netease',
              quality: native.quality || quality,
              bitrate: native.bitrate,
            }
          }
        } catch {
          // Fall through to the same direct GD fallback used by Kumone.
        }
      }
      const result = await nativeUrl(item, quality)
      if (!result?.url) throw new Error('Kumone 没有返回可播放地址')
      return { url: result.url, source: result.source, quality }
    },

    async getLyric(item) {
      const source = String(item.subSource || (item as any).source || 'netease')
      const lyricId = String(item.lyricId || item.id || '')
      if (!isNative()) {
        return requestJson(`/api/why-lyric?id=${encodeURIComponent(lyricId)}&source=${encodeURIComponent(source)}`)
      }
      if (typeof window !== 'undefined' && window.KumoneSource) {
        try { return await window.KumoneSource.lyric({ id: lyricId }) } catch { /* use GD fallback */ }
      }
      return gdRequest('lyric', { source, id: lyricId })
    },

    async getMusicArtwork(item: MusicItem) {
      const source = String(item.subSource || (item as any).source || 'netease')
      const picId = String(item.picId || item.id || '')
      if (!isNative()) {
        const result = await requestJson(`/api/why-pic?id=${encodeURIComponent(picId)}&source=${encodeURIComponent(source)}&size=500`)
        return result?.url || ''
      }
      const result = await gdRequest('pic', { source, id: picId, size: 500 })
      return result?.url || ''
    },
  }
}
