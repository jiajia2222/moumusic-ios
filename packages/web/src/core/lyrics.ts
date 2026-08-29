/**
 * LRC 歌詞解析。
 *
 * 上游給的是標準 LRC：`[mm:ss.xx]歌詞`，逐行（不是逐字 —— 這個資料源沒有
 * 卡拉OK式的字級時間軸，行級高亮就是上限）。
 *
 * 兩個實測踩到的形狀，解析時要處理：
 *
 * 1. **開頭十幾行是製作人員名單** ——「唱 : 雷同二友」「曲 : 謝芊彤」
 *    「電結他 Electric Guitars : Moo@WHIZZ」…，時間戳每行差 1 秒全部擠在
 *    前 15 秒。照播的話開場十幾秒瘋狂滾動、真正的第一句還沒到。所以把
 *    「短冒號行」判為名單濾掉 —— 判斷條件是含冒號、且冒號左邊很短（欄位名
 *    不會長），這比「前 N 行一律丟」安全：有些歌真的一開頭就唱。
 *
 * 2. **一行多個時間戳** ——`[00:12.00][01:20.00]副歌`（重複段落共用一行）。
 *    要展開成多筆，否則第二次唱到時不會高亮。
 */

export type LyricWord = { text: string; start: number; duration: number }
export type LyricLine = {
  time: number
  text: string
  translation?: string
  romaji?: string
  words?: LyricWord[]
}

/** `[mm:ss.xx]` / `[mm:ss:xx]` / `[mm:ss]`，小數位 1~3 位都見過 */
const TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

/**
 * 製作人員名單行：`欄位 : 值`。
 *
 * 只看有沒有冒號分隔，不限制欄位名長度 —— 實測欄位名經常是中英雙語，
 * 「电结他 Electric Guitars : Moo@WHIZZ」左邊就 22 字，用長度上限一定漏。
 * 誤殺歌詞的風險靠「只在開頭連續區塊套用」擋掉（見 parseLrc）。
 */
const CREDIT = /^[^:：]+\s*[:：]\s*\S/

/** LRC 純文字 → 有序的行陣列。空歌詞、純文字（無時間戳）都回空陣列 */
export function parseLrc(raw: string): LyricLine[] {
  const out: LyricLine[] = []
  /**
   * 還在開頭的名單區塊裡。名單一定是連續的一段（唱→曲→詞→編→監→樂手…），
   * 所以只在真正的第一句歌詞出現**之前**濾冒號行 —— 之後就算歌詞裡有冒號
   * （英文歌的 "Baby: come on" 之類）也不會被誤刪。
   */
  let inCredits = true
  for (const line of String(raw || '').split(/\r?\n/)) {
    TAG.lastIndex = 0
    const stamps: number[] = []
    let m: RegExpExecArray | null
    while ((m = TAG.exec(line)) !== null) {
      const frac = m[3] ? Number(`0.${m[3]}`) : 0
      stamps.push(Number(m[1]) * 60 + Number(m[2]) + frac)
    }
    if (stamps.length === 0) continue
    const text = line.replace(TAG, '').trim()
    if (!text) continue
    if (inCredits) {
      if (CREDIT.test(text)) continue
      inCredits = false
    }
    // 同一行的多個時間戳各算一筆（重複段落）
    for (const time of stamps) out.push({ time, text })
  }
  out.sort((a, b) => a.time - b.time)
  return out
}

const WORD_TAG_BEFORE = /\((\-?\d+)\s*,\s*(\-?\d+)(?:\s*,[^)]*)?\)/g
const WORD_TAG_AFTER = /<(\-?\d+)\s*,\s*(\-?\d+)(?:\s*,[^>]*)?>/g
const YRC_LINE = /^\s*\[(\-?\d+)\s*,\s*(\-?\d+)\](.*)$/
const LX_LRC_LINE = /^\s*\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\](.*)$/

/**
 * Parse LX/Kumone-style word timed lyric lines. LX returns both
 * `[startMs,durationMs](offset,duration,0)word` and the transformed
 * `[mm:ss.xx]word<offset,duration>word` form.
 */
export function parseYrc(raw: string): LyricLine[] {
  const lines: LyricLine[] = []
  for (const rawLine of String(raw || '').split(/\r?\n/)) {
    const yrcMatch = rawLine.match(YRC_LINE)
    const lrcMatch = yrcMatch ? null : rawLine.match(LX_LRC_LINE)
    if (!yrcMatch && !lrcMatch) continue
    const time = yrcMatch
      ? Number(yrcMatch[1]) / 1000
      : Number(lrcMatch![1]) * 60 + Number(lrcMatch![2]) + Number(`0.${lrcMatch![3] || 0}`)
    const words: LyricWord[] = []
    const body = yrcMatch ? yrcMatch[3] : lrcMatch![4]
    const afterTags: RegExpExecArray[] = []
    WORD_TAG_AFTER.lastIndex = 0
    let tag: RegExpExecArray | null
    while ((tag = WORD_TAG_AFTER.exec(body)) !== null) afterTags.push(tag)

    if (afterTags.length > 0) {
      // LX's transformed lyric places each word before its timing marker:
      // `word<start,duration>word<start,duration>`.
      let cursor = 0
      for (const current of afterTags) {
        const text = body.slice(cursor, current.index)
        if (text.trim()) words.push({
          text,
          start: time + Math.max(0, Number(current[1])) / 1000,
          duration: Math.max(0, Number(current[2])) / 1000,
        })
        cursor = current.index + current[0].length
      }
    } else {
      const beforeTags: RegExpExecArray[] = []
      WORD_TAG_BEFORE.lastIndex = 0
      while ((tag = WORD_TAG_BEFORE.exec(body)) !== null) beforeTags.push(tag)
      for (let i = 0; i < beforeTags.length; i++) {
        const current = beforeTags[i]
        const next = beforeTags[i + 1]
        // Some YRC producers put each timing marker immediately before its word.
        const text = body.slice(current.index + current[0].length, next?.index ?? body.length)
        if (text.trim()) words.push({
          text,
          start: time + Math.max(0, Number(current[1])) / 1000,
          duration: Math.max(0, Number(current[2])) / 1000,
        })
      }
    }
    const lineText = words.map(word => word.text).join('').trim()
    if (lineText) lines.push({ time, text: lineText, words })
  }
  return lines.sort((a, b) => a.time - b.time)
}

const lyricText = (value: unknown): string => typeof value === 'string' ? value : ''

const mergeTimedLines = (lines: LyricLine[], extra: LyricLine[], field: 'translation' | 'romaji') => {
  if (lines.length === 0 || extra.length === 0) return lines
  let cursor = 0
  for (const line of lines) {
    while (cursor + 1 < extra.length && extra[cursor + 1].time <= line.time + 0.35) cursor++
    const candidate = extra[cursor]
    if (candidate && Math.abs(candidate.time - line.time) <= 0.35 && candidate.text !== line.text) {
      line[field] = candidate.text
    }
  }
  return lines
}

/**
 * Normalize the response shapes used by Moumusic, LX Music and Kumone.
 * LX returns lyric/tlyric/rlyric/lxlyric while Kumone exposes LRC/YRC as
 * separate parsed layers. The app keeps one timeline and attaches translated
 * or word-timed data to the matching original line.
 */
export function parseLyricResponse(raw: unknown): LyricLine[] {
  if (typeof raw === 'string') return parseLrc(raw)
  if (!raw || typeof raw !== 'object') return []
  const value = raw as Record<string, unknown>
  const original = lyricText(value.lyric || value.lrc || value.rawLrc)
  const yrc = parseYrc(lyricText(value.yrc || value.lxlyric))
  const lines = yrc.length > 0 ? yrc : parseLrc(original)
  mergeTimedLines(lines, parseLrc(lyricText(value.tlyric)), 'translation')
  mergeTimedLines(lines, parseLrc(lyricText(value.rlyric || value.romalrc || value.yromalrc)), 'romaji')
  return lines
}

/**
 * 目前該高亮第幾行。回 -1 表示還沒到第一句（前奏）。
 *
 * 用二分搜尋而不是 findIndex：這個函式跟著 timeupdate 每秒跑，歌詞有上百行，
 * 沒必要每次線性掃。
 */
export function currentLyricIndex(lines: LyricLine[], time: number): number {
  if (lines.length === 0 || time < lines[0].time) return -1
  let lo = 0
  let hi = lines.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (lines[mid].time <= time) lo = mid
    else hi = mid - 1
  }
  return lo
}

/**
 * 給「複製歌詞」用的純文字：去掉時間戳，一行一句。
 *
 * 用解析後的結果而不是原始 LRC —— 貼出去的東西不該帶 `[00:31.02]` 這種
 * 給程式看的標記，也不該帶製作人員名單。
 */
export function lyricsToText(lines: LyricLine[]): string {
  return lines.map(l => l.translation ? `${l.text}\n${l.translation}` : l.text).join('\n')
}
