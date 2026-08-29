import { MusicItem, Plugin, SearchType } from '../types'
import { viaProxy } from '../native'
import CryptoJS from 'crypto-js'

type LXRequestOptions = {
  method?: string
  timeout?: number
  headers?: Record<string, string>
  body?: BodyInit | null
  form?: unknown
  formData?: unknown
  binary?: boolean
}

type LXResponse = {
  statusCode: number
  statusMessage: string
  headers: Record<string, string>
  body: unknown
}

type LXRequestCallback = (error: Error | null, response: LXResponse | null, body: unknown) => void

type LXSourceInfo = {
  type?: string
  name?: string
  actions?: string[]
  qualitys?: string[]
}

const USER_API_MARKER = /\blx_setup\b|\blx\.send\s*\(|\bEVENT_NAMES\.inited\b|\bon\s*\(\s*EVENT_NAMES\.request/

const metadataValue = (code: string, key: string): string => {
  const match = code.match(new RegExp(`@${key}\\s+([^\\r\\n*]+)`, 'i'))
  return match?.[1]?.trim() || ''
}

const parseMetadata = (code: string) => ({
  id: metadataValue(code, 'id') || `moumusic-${Math.random().toString(36).slice(2)}`,
  name: metadataValue(code, 'name') || 'LX User API',
  description: metadataValue(code, 'description'),
  version: metadataValue(code, 'version') || '1.0.0',
  author: metadataValue(code, 'author'),
  homepage: metadataValue(code, 'homepage'),
})

const toBytes = (value: string): Uint8Array => new TextEncoder().encode(value)

/** Small synchronous MD5 implementation used by older LX source scripts. */
function md5(input: string): string {
  return CryptoJS.MD5(input).toString()
}

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

const base64ToBytes = (value: string): Uint8Array => {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

const bytesToWordArray = (bytes: Uint8Array) => CryptoJS.lib.WordArray.create(bytes as any)

const wordArrayToBytes = (wordArray: CryptoJS.lib.WordArray): Uint8Array => {
  const bytes = new Uint8Array(wordArray.sigBytes)
  for (let i = 0; i < wordArray.sigBytes; i++) {
    bytes[i] = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
  }
  return bytes
}

const lxBytes = (value: string | number[] | Uint8Array): Uint8Array => {
  if (typeof value === 'string') return toBytes(value)
  return value instanceof Uint8Array ? value : new Uint8Array(value)
}

const lxAesEncrypt = (
  value: string | number[] | Uint8Array,
  mode: string,
  key: string | number[] | Uint8Array,
  iv: string | number[] | Uint8Array,
): Uint8Array => {
  const data = bytesToWordArray(lxBytes(value))
  const keyWordArray = bytesToWordArray(lxBytes(key))
  const normalizedMode = String(mode || '').toLowerCase()
  const isEcb = normalizedMode === 'aes-128-ecb'
  if (!isEcb && normalizedMode !== 'aes-128-cbc') throw new Error(`Unsupported LX AES mode: ${mode}`)
  const options: Record<string, unknown> = {
    mode: isEcb ? CryptoJS.mode.ECB : CryptoJS.mode.CBC,
    padding: isEcb ? CryptoJS.pad.NoPadding : CryptoJS.pad.Pkcs7,
  }
  if (!isEcb) {
    const ivBytes = lxBytes(iv).slice(0, 16)
    const paddedIv = new Uint8Array(16)
    paddedIv.set(ivBytes)
    options.iv = bytesToWordArray(paddedIv)
  }
  return wordArrayToBytes(CryptoJS.AES.encrypt(data, keyWordArray, options).ciphertext)
}

type DerValue = { tag: number; value: Uint8Array; next: number }

const readDer = (bytes: Uint8Array, offset: number): DerValue => {
  const tag = bytes[offset]
  const lengthByte = bytes[offset + 1]
  if (tag === undefined || lengthByte === undefined) throw new Error('Invalid RSA public key')
  let length = lengthByte
  let cursor = offset + 2
  if ((lengthByte & 0x80) !== 0) {
    const lengthBytes = lengthByte & 0x7f
    if (lengthBytes === 0 || lengthBytes > 4) throw new Error('Invalid RSA public key length')
    length = 0
    for (let i = 0; i < lengthBytes; i++) length = length * 256 + bytes[cursor + i]
    cursor += lengthBytes
  }
  const end = cursor + length
  if (end > bytes.length) throw new Error('Invalid RSA public key length')
  return { tag, value: bytes.slice(cursor, end), next: end }
}

const derInteger = (value: Uint8Array): bigint => {
  let result = 0n
  for (const byte of value) result = (result << 8n) | BigInt(byte)
  return result
}

const parseRsaPublicKey = (pem: string): { modulus: bigint; exponent: bigint; size: number } => {
  const encoded = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const der = base64ToBytes(encoded)
  const outer = readDer(der, 0)
  const algorithm = readDer(outer.value, 0)
  const bitString = readDer(outer.value, algorithm.next)
  const rsaSequence = readDer(bitString.value.slice(1), 0)
  const modulus = readDer(rsaSequence.value, 0)
  const exponent = readDer(rsaSequence.value, modulus.next)
  const modulusBytes = modulus.value[0] === 0 ? modulus.value.slice(1) : modulus.value
  return { modulus: derInteger(modulusBytes), exponent: derInteger(exponent.value), size: modulusBytes.length }
}

const modPow = (base: bigint, exponent: bigint, modulus: bigint): bigint => {
  let result = 1n
  let current = base % modulus
  let power = exponent
  while (power > 0n) {
    if (power & 1n) result = (result * current) % modulus
    current = (current * current) % modulus
    power >>= 1n
  }
  return result
}

const lxRsaEncrypt = (value: string | number[] | Uint8Array, pem: string): Uint8Array => {
  const { modulus, exponent, size } = parseRsaPublicKey(pem)
  const input = lxBytes(value)
  if (input.length > size) throw new Error('LX RSA input is larger than the public key')
  const message = derInteger(input)
  const encrypted = modPow(message, exponent, modulus)
  const output = new Uint8Array(size)
  let valueLeft = encrypted
  for (let i = size - 1; i >= 0; i--) {
    output[i] = Number(valueLeft & 0xffn)
    valueLeft >>= 8n
  }
  return output
}

const createUtils = () => ({
  crypto: {
    md5: (input: string) => {
      if (typeof input !== 'string') throw new Error('param required a string')
      // LX's native preload URL-decodes before hashing; match that contract so
      // source signatures are identical on iOS, web and the LX mobile client.
      return md5(encodeURIComponent(input))
    },
    randomBytes: (size: number) => crypto.getRandomValues(new Uint8Array(size)),
    // Keep these synchronous to match LX's mobile contract; WebCrypto alone cannot
    // replace them because its API is promise-based.
    aesEncrypt: lxAesEncrypt,
    rsaEncrypt: lxRsaEncrypt,
  },
  buffer: {
    from: (input: string | number[] | Uint8Array, encoding?: string) => {
      if (typeof input !== 'string') return new Uint8Array(input)
      if (encoding === 'base64') return base64ToBytes(input)
      if (encoding === 'hex') return Uint8Array.from(input.match(/.{1,2}/g) || [], x => parseInt(x, 16))
      return toBytes(input)
    },
    bufToString: (input: Uint8Array, encoding = 'utf8') => {
      if (encoding === 'base64') return bytesToBase64(input)
      if (encoding === 'hex') return Array.from(input, byte => byte.toString(16).padStart(2, '0')).join('')
      return new TextDecoder().decode(input)
    },
  },
})

const qualityForLX = (quality?: string): string => {
  switch (quality) {
    case '128': return '128k'
    case '192': return '192k'
    case '320': return '320k'
    case '740': return 'flac'
    case '999': return 'flac24bit'
    default: return quality || '320k'
  }
}

const isObject = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object'

export function isLXUserApiCode(code: string): boolean {
  return USER_API_MARKER.test(code)
}

/**
 * Run an LX mobile User API in the same narrow sandbox as normal source plugins.
 * LX User APIs are resolver APIs: they announce source ids and handle musicUrl,
 * lyric and pic requests; they do not normally implement search themselves.
 */
export function loadLXUserApi(
  code: string,
  fetcher: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): Plugin {
  const meta = parseMetadata(code)
  const sourceInfo: Record<string, LXSourceInfo> = {}
  let requestHandler: ((data: { source: string; action: string; info: any }) => any) | null = null
  let inited = false
  const utils = createUtils()
  const globalObject: Record<string, any> = {}
  const eventNames = { request: 'request', inited: 'inited', updateAlert: 'updateAlert' }

  const request = (url: string, options: LXRequestOptions = {}, callback: LXRequestCallback): (() => void) => {
    let cancelled = false
    const method = String(options.method || 'GET').toUpperCase()
    const headers = options.headers || {}
    let body: BodyInit | undefined
    if (options.body != null) body = typeof options.body === 'string' ? options.body : options.body
    else if (options.form != null) body = new URLSearchParams(options.form as Record<string, string>).toString()
    else if (options.formData != null) body = JSON.stringify(options.formData)
    if (options.form && !headers['Content-Type']) headers['Content-Type'] = 'application/x-www-form-urlencoded'

    const timeout = typeof options.timeout === 'number' && options.timeout > 0
      ? Math.min(options.timeout, 60_000) : 60_000
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timer = setTimeout(() => controller?.abort(), timeout)
    void fetcher(viaProxy(url, method), {
      method,
      headers,
      body,
      signal: controller?.signal,
      // Private field consumed by pluginFetch for the native bridge; browsers
      // simply ignore it after a normal fetch succeeds.
      __moumusicBinary: options.binary,
    } as RequestInit).then(async response => {
      const bodyValue: unknown = options.binary
        ? new Uint8Array(await response.arrayBuffer())
        : await response.text()
      let rawBody: unknown = bodyValue
      if (!options.binary && typeof bodyValue === 'string' && /json/i.test(response.headers.get('content-type') || '')) {
        try { rawBody = JSON.parse(bodyValue) } catch { /* preserve the text */ }
      }
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => { responseHeaders[key] = value })
      if (!cancelled) callback(null, {
        statusCode: response.status,
        statusMessage: response.statusText,
        headers: responseHeaders,
        body: rawBody,
      }, rawBody)
    }).catch(error => {
      if (!cancelled) callback(error instanceof Error ? error : new Error(String(error)), null, null)
    }).finally(() => clearTimeout(timer))

    return () => {
      cancelled = true
      controller?.abort()
    }
  }

  const send = async (eventName: string, data: any) => {
    if (eventName === eventNames.inited) {
      for (const [id, info] of Object.entries(data?.sources || {})) {
        if (isObject(info)) sourceInfo[id] = { ...info, actions: Array.isArray(info.actions) ? info.actions : [] }
      }
      inited = true
      return
    }
    if (eventName === eventNames.updateAlert) return
    throw new Error(`LX event is not supported: ${eventName}`)
  }

  const on = async (eventName: string, handler: any) => {
    if (eventName !== eventNames.request || typeof handler !== 'function') {
      throw new Error(`LX event is not supported: ${eventName}`)
    }
    requestHandler = handler
  }

  const lx = {
    EVENT_NAMES: eventNames,
    request,
    send,
    on,
    utils,
    currentScriptInfo: { ...meta, rawScript: code },
    version: '2.0.0',
    env: 'mobile',
  }
  globalObject.lx = lx
  Object.assign(globalObject, {
    fetch: fetcher,
    setTimeout,
    clearTimeout,
    Promise,
    URL,
    URLSearchParams,
    console,
  })

  // The mobile runtime calls lx_setup before evaluating the user script. Execute
  // the same lifecycle here, while exposing the aliases used by older scripts.
  const setup = () => lx
  const script = new Function(
    'lx_setup', 'globalThis', 'lx', 'EVENT_NAMES', 'on', 'send', 'request', 'utils',
    'fetch', 'console', 'setTimeout', 'clearTimeout', 'Promise', 'URL', 'URLSearchParams',
    code,
  )
  script(
    setup, globalObject, lx, eventNames, on, send, request, utils, fetcher,
    console, setTimeout, clearTimeout, Promise, URL, URLSearchParams,
  )

  const chooseSource = (item: MusicItem, action: string): string => {
    const requested = String((item as any).source || (item as any).sourceId || item.subSource || '')
    if (requested && sourceInfo[requested]?.actions?.includes(action)) return requested
    const match = Object.entries(sourceInfo).find(([, info]) => info.actions?.includes(action))
    if (match) return match[0]
    if (requested) return requested
    throw new Error(`LX 音源未声明 ${action} 能力`)
  }

  const call = async (item: MusicItem, action: string, quality?: string): Promise<any> => {
    if (!requestHandler) throw new Error('LX 音源尚未完成初始化')
    if (!inited && Object.keys(sourceInfo).length === 0) {
      // inited is normally sent synchronously during script evaluation; this only
      // improves the error when a malformed script starts serving requests early.
      throw new Error('LX 音源未发送 inited 信息')
    }
    const source = chooseSource(item, action)
    return await requestHandler.call(lx, {
      source,
      action,
      info: { type: qualityForLX(quality), musicInfo: item },
    })
  }

  const plugin: Plugin = {
    platform: meta.name,
    name: meta.name,
    version: meta.version,
    description: meta.description,
    author: meta.author,
    instance: { id: meta.id, sourceInfo, lxUserApi: true },
    supportedMethods: new Set(['getMediaSource', 'getLyric', 'getMusicArtwork']),
    async search(_query: string, _page = 1, _type: SearchType = 'music') {
      // Standard LX User API sources deliberately do not search. Search-capable
      // custom scripts can opt into the extension by declaring action=search.
      if (!Object.values(sourceInfo).some(info => info.actions?.includes('search'))) {
        return { data: [], isEnd: true }
      }
      const result = await call({ id: '', platform: meta.name, title: _query, artist: '' }, 'search')
      return Array.isArray(result) ? { data: result, isEnd: true } : result
    },
    async getMediaSource(item, quality) {
      const result = await call(item, 'musicUrl', quality)
      const data = isObject(result) && 'data' in result ? result.data : result
      if (typeof data === 'string') return { url: data }
      return {
        url: String(data?.url || ''),
        quality,
        headers: isObject(data) ? data.headers : undefined,
      }
    },
    async getLyric(item) {
      const result = await call(item, 'lyric')
      return isObject(result) && 'data' in result ? result.data : result
    },
    async getMusicArtwork(item) {
      const result = await call(item, 'pic')
      return isObject(result) && 'data' in result ? result.data : result
    },
  }
  return plugin
}
