import { MusicItem, Plugin } from '../types'
import { viaProxy } from '../native'
import { pluginFetch } from './runner'

const requestJson = async (url: string, init?: RequestInit): Promise<any> => {
  const response = await pluginFetch(viaProxy(url), init)
  const text = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  try { return JSON.parse(text) } catch { return text }
}

const kuwoSearchUrl = (query: string, page: number) => (
  `https://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(query)}`
  + `&pn=${Math.max(0, page - 1)}&rn=30&uid=794762570&ver=kwplayer_ar_9.2.2.1`
  + '&vipver=1&show_copyright_off=1&newver=1&ft=music&cluster=0&strategy=2012'
  + '&encoding=utf8&rformat=json&vermerge=1&mobi=1&issubtitle=1'
)

const kuwoId = (raw: any): string => String(raw?.MUSICRID || raw?.musicrid || raw?.rid || '').replace(/^MUSIC_/, '')

/**
 * A small LX-shaped Kuwo search adapter. It deliberately contains no auth
 * token or copied source script; users may pair it with an LX User API for
 * playback URL resolution when the public play endpoint is unavailable.
 */
export function createLXKuwoPlugin(): Plugin {
  return {
    platform: 'LX Music / Kuwo',
    name: 'LX Music / Kuwo',
    version: '1.0.0',
    description: 'LX Music compatible Kuwo search, lyrics and artwork adapter',
    instance: { builtin: true, sourceId: 'kw' },
    supportedMethods: new Set(['search', 'getMediaSource', 'getLyric', 'getMusicArtwork']),
    async search(query, page = 1) {
      const result = await requestJson(kuwoSearchUrl(query, page))
      const list = Array.isArray(result?.abslist) ? result.abslist : []
      return {
        data: list.map((raw: any) => ({
          id: kuwoId(raw),
          songmid: kuwoId(raw),
          title: raw.NAME || raw.SONGNAME || '',
          artist: raw.ARTIST || raw.FARTIST || '',
          album: raw.ALBUM || '',
          duration: Number(raw.DURATION) || 0,
          source: 'kw',
          type: 'music',
        })),
        isEnd: list.length < 30,
      }
    },
    async getMediaSource(item, quality) {
      const id = String(item.songmid || item.id || '')
      if (!id) return { url: '' }
      const result = await requestJson(
        `https://kuwo.cn/api/v1/www/music/playUrl?mid=${encodeURIComponent(id)}&type=music&httpsStatus=1`,
        { headers: { Referer: 'https://www.kuwo.cn/', Accept: 'application/json' } },
      )
      const url = typeof result === 'string' ? result : result?.data?.url || result?.url
      if (!url) throw new Error(`Kuwo 没有返回 ${quality || '320'} 音质的播放地址`)
      return { url, quality, source: 'kw' }
    },
    async getLyric(item) {
      const id = String(item.songmid || item.id || '')
      const result = await requestJson(`https://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${encodeURIComponent(id)}`)
      const list = Array.isArray(result?.data?.lrclist) ? result.data.lrclist : []
      if (!list.length) return ''
      const lyric = list.map((line: any) => {
        const seconds = Number(line.time)
        if (!Number.isFinite(seconds)) return ''
        const minutes = Math.floor(seconds / 60)
        const rest = (seconds % 60).toFixed(2).padStart(5, '0')
        return `[${String(minutes).padStart(2, '0')}:${rest}]${String(line.lineLyric || '')}`
      }).filter(Boolean).join('\n')
      return { lyric }
    },
    async getMusicArtwork(item: MusicItem) {
      const id = String(item.songmid || item.id || '')
      return requestJson(
        `https://artistpicserver.kuwo.cn/pic.web?corp=kuwo&type=rid_pic&pictype=500&size=500&rid=${encodeURIComponent(id)}`,
      )
    },
  }
}
