export interface KumoneUnblockTrack {
  id?: string
  title?: string
  artist?: string
  duration?: number
  bitrate?: number
  exclude?: string[]
}

export function kumoneNeteaseEapi(path: string, payload: Record<string, unknown>, fetcher?: typeof fetch): Promise<any>
export function kumoneNeteaseWeapi(path: string, payload: Record<string, unknown>, fetcher?: typeof fetch): Promise<any>
export function searchKumoneNetease(query: string, page?: number, limit?: number, fetcher?: typeof fetch): Promise<any[]>
export function normalizeKumoneNeteaseTrack(raw: any): Record<string, unknown>
export function lyricKumoneNetease(id: string, fetcher?: typeof fetch): Promise<Record<string, string>>
export function resolveKumoneUnblock(track: KumoneUnblockTrack, fetcher?: typeof fetch, gdApi?: string): Promise<{ url: string; source: string; id: string; bitrate?: number } | null>
