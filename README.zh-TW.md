# Moumusic

[简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Português](README.pt.md)

Moumusic 是由 moumou 打造的輕量音樂播放器，可在瀏覽器與 iOS App 使用。支援搜尋、播放、收藏、歌詞、歌單與下載，不需要登入。

## 功能

- 首頁可切換已安裝的音源平台，包括网易云音樂、QQ 音樂、酷我與落雪等。
- 支援 LX Music / MusicFree 相容音源匯入；音源由使用者在「設置」頁加入，App 不會捆綁第三方音源。
- 支援 128、192、320、740 與 999 kbps 等音質檔位，可依音源能力取得高解析或無損音質。
- 支援歌詞解析、全屏歌詞、收藏、歌單匯入匯出、下載與跨裝置音源同步。
- 支援网易云熱歌榜等官方榜單；實際榜單由已安裝的音源回傳。

## iOS 播放體驗

iOS 原生版支援背景播放，並向鎖定畫面與控制中心提供封面、歌名、歌手、專輯、播放進度及播放控制。全屏歌詞與 Live Activity / Dynamic Island 會顯示目前歌詞行。由於 iOS 不提供第三方自訂控制中心歌詞欄位，歌詞不會直接繪製在系統控制中心媒體卡片內。

## 音源機制

專案與音源分離，不在倉庫或 IPA 內置音源。開啟 App 後進入「設置」，貼上自己的音源 URL 即可安裝。相容常見的 LX Music / MusicFree 方法與欄位，例如 `search`、`getMediaSource`、`getLyric`、`name`、`singer`、`pic` 與 `interval`。

## 本地開發

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

## iOS 未簽名 IPA

iOS 建置需要 macOS 26 與 Xcode 26：

```bash
pnpm build:ipa
# → ios/build/unsigned/Moumusic-unsigned.ipa
```

未簽名 IPA 不能直接安裝到 iPhone，必須使用 Apple 開發者憑證與 provisioning profile 完成簽名。

## 版本

目前穩定版：[Moumusic v1.10.16](https://github.com/jiajia2222/moumusic-ios/releases/tag/v1.10.16)。
