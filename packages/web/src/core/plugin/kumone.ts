import { isNative, viaProxy } from '../native'
import { MusicItem, Plugin, SearchType } from '../types'
import { pluginFetch } from './runner'
import {
  lyricKumoneNetease,
  normalizeKumoneNeteaseTrack,
  resolveKumoneUnblock,
  searchKumoneNetease,
} from '../../../shared/kumone.js'

/**
 * Kumone-compatible first-party source.
 *
 * This module is kept as an optional compatibility adapter for deployments that
 * explicitly wire it in. The app does not import or register it on startup;
 * normal installs receive music only from user-imported sources.
 */

const GD_API = 'https://music-api.gdstudio.xyz/api.php'
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

const artistName = (value: any): string => Array.isArray(value)
  ? value.filter(Boolean).join(' / ')
  : String(value || '')

const normalizeGdItem = (raw: any, fallbackSource = 'netease'): MusicItem => ({
  id: String(raw?.url_id || raw?.id || ''),
  title: String(raw?.name || raw?.title || ''),
  artist: artistName(raw?.artist || raw?.artists),
  album: String(raw?.album?.name || raw?.album || ''),
  artwork: text(raw?.pic || raw?.pic_url || raw?.artwork),
  platform: 'Kumone / NetEase',
  subSource: String(raw?.source || fallbackSource),
  picId: String(raw?.pic_id || raw?.picId || ''),
  lyricId: String(raw?.lyric_id || raw?.lyricId || ''),
  duration: Number(raw?.duration || raw?.interval || raw?.dt || 0) > 10000
    ? Number(raw?.duration || raw?.interval || raw?.dt || 0) / 1000
    : Number(raw?.duration || raw?.interval || raw?.dt || 0),
  type: 'music',
})

const backendOrGd = async (backendPath: string, types: string, params: Record<string, string | number>) => {
  if (!isNative()) return requestJson(backendPath)
  return gdRequest(types, params)
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
      if (isNative()) {
        try {
          const songs = await searchKumoneNetease(query, page, 30, pluginFetch)
          const data = songs.map(raw => normalizeGdItem(
            { ...normalizeKumoneNeteaseTrack(raw), source: 'netease' }, 'netease',
          ))
          if (data.length > 0) return { data, isEnd: data.length < 30 }
        } catch {
          // Android/webview transport can be unavailable; retain the GD fallback.
        }
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
          duration: String(item.duration || 0),
          exclude: Array.isArray(item._exclude) ? item._exclude.join(',') : '',
        })
        const result = await requestJson(`/api/why-url?${query.toString()}`)
        if (text(result?.url)) return {
          url: result.url,
          source: result.source || source,
          quality,
          bitrate: Number(result.bitrate) > 0 ? Number(result.bitrate) : undefined,
        }
        throw new Error('Kumone 没有返回可播放地址')
      }

      const result = await resolveKumoneUnblock({
        id: source === 'netease' ? String(item.id || '') : '',
        title: String(item.title || ''),
        artist: String(item.artist || ''),
        duration: Number(item.duration || 0),
        bitrate,
        exclude: item._exclude,
      }, pluginFetch, GD_API)
      if (!result?.url) throw new Error('Kumone 没有返回可播放地址')
      return {
        url: result.url,
        source: result.source,
        quality,
        bitrate: Number(result.bitrate) > 0 ? Number(result.bitrate) : undefined,
      }
    },

    async getLyric(item) {
      const source = String(item.subSource || (item as any).source || 'netease')
      const lyricId = String(item.lyricId || item.id || '')
      if (!isNative()) {
        return requestJson(`/api/why-lyric?id=${encodeURIComponent(lyricId)}&source=${encodeURIComponent(source)}`)
      }
      if (source === 'netease') {
        try { return await lyricKumoneNetease(lyricId, pluginFetch) } catch { /* use GD fallback */ }
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
