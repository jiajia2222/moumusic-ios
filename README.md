# Moumusic

[繁體中文](#繁體中文) · [简体中文](#简体中文) · [English](#english) · [日本語](#日本語) · [한국어](#한국어) · [Русский](#русский) · [Español](#español) · [Português](#português)

## 繁體中文

Moumusic 是由 moumou 打造的輕量音樂播放器，可在瀏覽器與 iOS App 使用。支援搜尋、播放、收藏、歌詞、歌單與下載；可在「設置」頁匯入 LX Music / MusicFree 相容音源，再切換网易云、QQ 音樂、酷我或落雪等平台。無需登入。iOS 版支援背景播放、鎖定畫面與控制中心的封面及播放控制、全屏歌詞，以及 Live Activity / Dynamic Island 歌詞顯示。

## 简体中文

Moumusic 是由 moumou 打造的轻量音乐播放器，可在浏览器和 iOS App 中使用。支持搜索、播放、收藏、歌词、歌单和下载；可在“设置”页导入 LX Music / MusicFree 兼容音源，再切换网易云、QQ 音乐、酷我或落雪等平台。无需登录。iOS 版支持后台播放、锁屏和控制中心的封面及播放控制、全屏歌词，以及 Live Activity / Dynamic Island 歌词显示。

## English

Moumusic is a lightweight music player built by moumou for the browser and iOS. It supports search, playback, favourites, lyrics, playlists and downloads. Import an LX Music / MusicFree-compatible source from Settings to use services such as NetEase Cloud Music, QQ Music, Kuwo or Luoxue. No account is required. The iOS app supports background playback, artwork and controls on the Lock Screen and Control Center, full-screen lyrics, and lyric updates in Live Activities / Dynamic Island.

## 日本語

Moumusic は moumou が開発する軽量音楽プレーヤーです。ブラウザと iOS App で検索、再生、お気に入り、歌詞、プレイリスト、ダウンロードを利用できます。「設定」から LX Music / MusicFree 互換の音源を追加し、NetEase Cloud Music、QQ Music、Kuwo、Luoxue などを切り替えられます。ログインは不要です。iOS 版はバックグラウンド再生、ロック画面とコントロールセンターのアートワーク・操作、全画面歌詞、Live Activity / Dynamic Island の歌詞表示に対応します。

## 한국어

Moumusic은 moumou가 만든 가벼운 음악 플레이어로 브라우저와 iOS App에서 사용할 수 있습니다. 검색, 재생, 즐겨찾기, 가사, 플레이리스트와 다운로드를 지원합니다. ‘설정’에서 LX Music / MusicFree 호환 음원을 가져오면 NetEase Cloud Music, QQ Music, Kuwo, Luoxue 등의 플랫폼을 전환할 수 있습니다. 로그인이 필요하지 않습니다. iOS 버전은 백그라운드 재생, 잠금 화면과 제어 센터의 앨범 아트·재생 제어, 전체 화면 가사, Live Activity / Dynamic Island 가사 표시를 지원합니다.

## Русский

Moumusic — лёгкий музыкальный проигрыватель от moumou для браузера и iOS. Он поддерживает поиск, воспроизведение, избранное, тексты песен, плейлисты и загрузку. В разделе «Настройки» можно импортировать источники, совместимые с LX Music / MusicFree, и переключаться между NetEase Cloud Music, QQ Music, Kuwo, Luoxue и другими платформами. Регистрация не требуется. Версия для iOS поддерживает фоновое воспроизведение, обложку и управление на экране блокировки и в Пункте управления, полноэкранные тексты и отображение текущей строки в Live Activity / Dynamic Island.

## Español

Moumusic es un reproductor de música ligero creado por moumou para el navegador y iOS. Permite buscar y reproducir música, guardar favoritos, ver letras, gestionar listas y descargar canciones. Desde «Ajustes» puedes importar fuentes compatibles con LX Music / MusicFree y cambiar entre NetEase Cloud Music, QQ Music, Kuwo, Luoxue y otras plataformas. No requiere una cuenta. La versión para iOS ofrece reproducción en segundo plano, carátula y controles en la pantalla bloqueada y el Centro de control, letras a pantalla completa y letras actualizadas en Live Activity / Dynamic Island.

## Português

Moumusic é um reprodutor de música leve criado por moumou para navegador e iOS. Ele oferece pesquisa, reprodução, favoritos, letras, playlists e downloads. Em “Configurações”, importe uma fonte compatível com LX Music / MusicFree para alternar entre NetEase Cloud Music, QQ Music, Kuwo, Luoxue e outras plataformas. Não é necessário fazer login. O app para iOS oferece reprodução em segundo plano, capa e controles na tela bloqueada e na Central de Controle, letras em tela cheia e atualização das letras no Live Activity / Dynamic Island.

> 支援語言 / Languages: 繁體中文、简体中文、English、日本語、한국어、Русский、Español、Português。應用會依系統語言自動選擇，也可以在「設置 / Settings」中手動切換。

部署步驟 / Deployment → [DEPLOY.md](DEPLOY.md) ｜ 發布版本 / Releases → [Releases](../../releases)

## 這是什麼 / What is Moumusic

Moumusic 是一個跑在瀏覽器裡的音樂播放器。播放器與音源徹底分開：前端不認識任何音源，只透過
一層插件介面問「給我一個可播的 URL」，音源自己去處理搜尋、扇出、救援、簽名。

**app 出廠不帶任何音源** —— 開啟後要到「設置」頁貼上網址安裝，才能搜尋與播放。
這是刻意的（見下）。

插件是一支 CommonJS 檔案，`module.exports` 出幾個方法就是一個音源；載入時跑在
`new Function` 的沙箱裡。**這個 repo 不含任何音源** —— 音源由使用者自己提供。

沙箱刻意很小：只給 `fetch`、計時器、`URL`、`btoa`/`atob` 與 `console`，沒有 `window`、
沒有 `document`、沒有 `localStorage`，也**不提供任何 npm 模組** —— 插件要什麼自己用
原生 `fetch` 去拿，需要跨域代抓時打 `/api/proxy?url=<目標>`。要求模組會直接拋錯並
說明原因，而不是回一個空物件讓插件在後面某處莫名炸掉。

## 音源

### Moumusic 官方聚合音源（需自行安裝）

對外是一個音源，底下並發扇出到兩個子音源後交錯合併、同名同歌手去重：

| 子音源 | 覆蓋範圍 |
|--------|----------|
| `netease` | 簡體華語曲庫最完整，附歌詞與封面 |
| `joox` | 港台繁體、粵語與 live 版本多 |

兩者都經一個公開 API 取得，**由瀏覽器直連**、不經本站後端。這樣上游的 IP 限流是
各使用者各自計算，而不是全站共用一個出口；音源也因此不依賴任何特定後端，同一支
插件貼到任何一份 Moumusic 都能用。上游位址寫在音源檔裡，換一家
只要改那支檔案。

**跨子源救援**：單一子源取不到音源時，會用歌名+歌手到其餘子源找同一首歌。比對前
做繁簡歸一化，所以查「浮誇」也能命中簡體源的「浮夸」。

**播不出來時換子源**：音源給了 URL 但瀏覽器實際播不出來（CDN 對該地區回 403、
容器格式不支援…）時，前端會把該子源排除後請音源換一個再試同一首歌。這種失敗
只有播放端知道 —— 音源那邊只知道「解析成功」。

### 安裝與更新

**這個專案不隨附音源，產物與 repo 裡都沒有任何音源檔。** 安裝方式只有一種：
到「設置」頁貼上你自己的音源網址。那個網址要能被瀏覽器抓到（同源、或對方送 CORS
標頭）。

安裝時會把程式碼整份存進瀏覽器的 localStorage，之後執行時不再向外抓 —— 換句話說
裝完就與那個網址無關了。代價是它不會自動更新：音源改版後要在「設置」頁重新貼一次。

改音源邏輯不必改前端程式碼。第三方插件同樣是貼網址安裝；外部網址由後端經
`/api/proxy` 代抓，你的瀏覽器不必連得到那個託管站。

## 播放器與音源完全分離

前端不直接呼叫任何音源 API，全部經插件介面：

| 功能 | 插件方法 |
|------|----------|
| 搜尋（歌曲） | `search(query, page, type)` |
| 推薦 | `getRecommend(mode, limit)` — 本專案擴充的方法 |
| 播放 / 下載 | `getMediaSource(item)` |
| 歌詞 / 封面 | `getLyric` / `getMusicArtwork` |

`play()` 裡沒有任何平台名稱的判斷 —— 它只問音源要一個可播的 URL 然後播。要不要
跨源救援、要不要簽名、音質怎麼選，全是插件的事，**加新音源不必改前端**。

因此沒裝音源時整個 app 沒有內容：推薦與搜尋都顯示「需要音源」。插件未實作某個
方法時回 `null`，UI 會明確說「此音源不支援」，而不是顯示空清單讓人以為壞了。

前端剩下的兩個 `/api/` 呼叫都不是音源 API：`/api/proxy`（跨域代抓）與
沒有任何供應音源的端點 —— 音源不由本站提供。

## 收藏與歌單

曲目右邊的心心加入收藏，「收藏」頁列出全部並**依序播放** —— 那是自己一首一首挑
出來的清單，順序有意義。

收藏存在瀏覽器本機（localStorage），所以綁裝置。要搬到別處有兩條路：

**匯出 / 匯入歌單**（「設置」→ 歌單）。匯出成 Markdown：

```markdown
# Moumusic 收藏

匯出時間：2026-08-19 12:49
共 2 首

1. 月亮代表我 — moon tang
2. 等一等 — The Hertz
```

任何文字編輯器、筆記軟體、聊天視窗都打得開。檔尾另藏一段 HTML 註解裡的 JSON ——
Markdown 算繪時看不見，但匯入本站時能精確還原（含 id 與子音源），不必逐首重新搜尋。

匯入也吃**任何純文字清單**（一行一首「歌名 - 歌手」），會逐首用音源搜尋比對，
找不到的會明確列出來。分隔符接受破折號、連字號、tab 與 `by`，編號和項目符號會自動
剝掉，上限 200 行。

**換裝置同步**（「設置」→ 換裝置）。產生一組 8 碼配對碼，另一台裝置輸入即可套用
目前安裝的音源，24 小時後失效。沒有帳號也不存任何個人資料。只同步音源，收藏請用
歌單匯出。

需要後端有儲存（CF 用 KV、自架用檔案系統），沒有就整區隱藏。

## 推薦頁

首頁可切換已啟用的平台（Moumusic 聚合、网易云、QQ 音樂、酷我或 LX Music），並提供
熱門、粵語、中文、K-pop、歐美分類。官方聚合音源可回報网易云热歌榜等榜單說明；
分類對應哪份榜單由音源決定並自報，前端不寫死。

## 播放模式

播放器上的按鈕循環切換三種模式，選擇記在 localStorage：

| 圖示 | 模式 | 行為 |
|------|------|------|
| 🔁 | 自動續播（預設） | 清單**依序**；推薦頁**隨機**（千首榜單依序播會永遠繞在前幾首） |
| 🔂 | 單曲循環 | 用 `audio` 原生 `loop`，重播不必重新解析音源，沒有可聽出來的空隙 |
| ➡️ | 播完即停 | — |

自動續播撞到播不出來的歌會跳過它繼續，連續失敗 8 首才收手。使用者自己點的那首
失敗時仍會彈窗告知 —— 那是他明確選的，不該默默跳走。

## 手機背景播放

播放器用**兩個 audio 元素輪替**：下一首在前台就先載進閒置的那一個，換歌時只對一個
已經載好的元素呼叫 `play()`，不動 `src`、不碰網路。在背景換 `src` 會讓音訊工作階段
失效，那正是「鎖屏播到一半就沒聲音」的成因。

同時註冊 MediaSession，鎖定畫面／通知欄／耳機按鈕都能控制。

iOS App 另外接入原生 Now Playing：控制中心與鎖定畫面可顯示封面、歌名、歌手、專輯、
播放進度並控制上一首／下一首；全屏歌詞頁與 Live Activity 顯示目前歌詞行。iOS 不允許
第三方 App 任意繪製桌面懸浮窗，因此以 Live Activity 作為系統級桌面歌詞入口。

平台差異（實測）：

- **Android** 建議「加到主畫面」裝成應用。部分國產 ROM 只給已安裝的應用完整的鎖屏
  媒體控制待遇；鎖屏看不到控制項時，先檢查該 ROM 的鎖屏通知顯示設定與瀏覽器的
  後台活動權限 —— 那些是系統設定，網頁沒有 API 可以覆寫。
- **iOS 建議直接用 Safari**，不要用桌面應用。iOS 的獨立模式（standalone）對背景音訊
  支援很差，鎖屏會播不下去。因此 iOS 上不會進入獨立模式，「加到主畫面」只會是一個
  開 Safari 的捷徑。

MediaSession 需要 secure context，所以純 HTTP 的部署（例如沒配憑證的 VPS）不會有
鎖屏控制。

## 介面

預設是蘋果平面風的深色 UI（大標題、分段控制、毛玻璃底欄、單一強調色）。
舊版的藍色漸層介面仍在 `packages/web/src/ui/ClassicUI.tsx`，沒有切換按鈕，
需要時可設 `localStorage.setItem('musicfree-ui', 'classic')` 切回去。

兩套 UI 共用同一份 `useMusicApp()` hook，換皮不必動任何音源或播放邏輯。

「設置」頁底部顯示前端與後端各自的建置戳記。兩者應一致 —— 不一致代表只部署了
一半（例如前端上去了但後端沒有），而不是快取問題。

## 快速開始

### 部署

| | **Cloudflare Pages** | **VPS / 自建** |
|---|---|---|
| 費用 | 免費 | 一臺 VPS |
| 功能 | 完整 | 完整（純 HTTP 時沒有鎖屏控制） |
| 配對碼儲存 | KV binding | 檔案系統 |
| 上游快取 | 只在單一 isolate 內 | 全站共用 |

```bash
pnpm install
pnpm deploy:cf      # 部署到 Cloudflare Pages
```

不想裝任何工具的話，[Releases](../../releases) 有現成的 zip，直接拖進 Cloudflare
儀表板就能部署。自己產一份：

```bash
pnpm build:zip      # → dist-cf/musicweb-cf.zip
```

詳細步驟見 [DEPLOY.md](DEPLOY.md)。

### 本地開發

```bash
pnpm install
pnpm dev            # 前端 dev server（API 需另外跑自架後端）
pnpm build          # 編譯前端
pnpm build:cf       # 前端 + _worker.js（不含音源），戳記只算一次傳給兩邊
pnpm typecheck
```

### iOS 未簽名 IPA

專案現在也包含 Capacitor iOS 原生工程。因為 Capacitor 8.5 使用 Swift 6 編譯器特性，
IPA 建置必須在 macOS 26 + Xcode 26（或更新版本）執行，並刻意關閉程式碼簽名：

```bash
pnpm install
pnpm build:ipa
# → ios/build/unsigned/Moumusic-unsigned.ipa
```

這個 IPA 只能作為檢查、CI 產物或後續簽名的輸入，不能直接安裝到 iPhone。要在真機
安裝，仍需使用 Apple 開發者憑證與 provisioning profile 重新簽名。iOS 原生工程把
背景音訊模式與 AVAudioSession 設為音樂播放用途，鎖屏播放由系統音訊工作階段維持。

自架後端（同時服務前端與 API）：

```bash
node packages/web/scripts/server.mjs      # 預設 :8788
```

## 專案結構

```
musicweb/
│   └── Moumusic 音源插件（由使用者自行匯入）
├── packages/
│   ├── core/                      # 播放器 + 插件管理器（型別與沙箱）
│   └── web/
│       ├── src/
│       │   ├── musicApp.ts        # 所有狀態與行為（兩套 UI 共用）
│       │   ├── App.tsx            # 外殼：取狀態、決定套哪張皮
│       │   ├── main.tsx           # 掛載 + service worker 註冊策略
│       │   ├── ui/AppleUI.tsx     # 預設介面
│       │   ├── ui/ClassicUI.tsx   # 舊介面（保留）
│       │   └── core/              # Player（雙元素）/ PluginManager / 插件沙箱
│       ├── shared/sync.js         # 配對碼規則（兩個後端共用）
│       ├── worker/                # Cloudflare 版後端
│       │   ├── index.js           # 路由（打包成 dist/_worker.js）
│       │   └── why.js             # 音源邏輯（後端側，插件的備援路徑）
│       ├── scripts/server.mjs     # 自架後端（Node，零外部依賴）
│       ├── public/                # logo / favicon / manifest / sw.js
│       └── wrangler.toml          # Pages 設定與 KV binding
├── scripts/
│   ├── build-cf.mjs               # 完整建置（戳記只算一次傳給前端與 worker）
│   ├── build-stamp.mjs            # 建置戳記
│   ├── build-worker.mjs           # 打包 worker → dist/_worker.js
│   ├── build-cf-zip.mjs           # 產出可拖拉上傳的 zip
│   └── build-ipa.mjs              # macOS 上產出未簽名 iOS IPA
├── ios/                           # Capacitor iOS 原生工程
├── .env.example
└── DEPLOY.md
```

## 技術棧

| 層 | 技術 |
|----|------|
| 前端 | React 18 + TypeScript + Tailwind CSS |
| 核心 | 自製插件系統（PluginManager + 雙元素 Player + `new Function` 沙箱） |
| CF 後端 | Cloudflare Workers（單一 `_worker.js`，esbuild 打包）+ KV |
| 自架後端 | Node.js（零外部依賴，只用內建模組） |

## License

MIT
