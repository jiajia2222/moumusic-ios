# Moumusic

[简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Português](README.pt.md)

Moumusic is a lightweight music player built by moumou for the browser and iOS. It supports search, playback, favourites, lyrics, playlists and downloads without requiring an account.

## Features

- Switch between installed sources such as Kumone / NetEase, QQ Music, Kuwo and Luoxue from the home screen. Kumone / NetEase is bundled on a clean install.
- Import LX Music User API and MusicFree-compatible sources from Settings, either by URL or local `.js` file. The bundled Kumone / NetEase adapter uses the web backend or the native iOS bridge, while the LX/Kuwo adapter preserves the source workflow.
- Choose quality levels including 128, 192, 320, 740 and 999 kbps, depending on what the selected source provides.
- Parse LRC, translated lyrics and LX/Kumone-style YRC word timings; full-screen lyrics show translations and iOS Live Activity / Dynamic Island follows the active line.
- Use Kumone-style NetEase/GD multi-source fallback and show official charts such as NetEase Cloud Music hot songs when available.

## iOS playback

The native iOS app supports background playback and sends artwork, title, artist, album, progress and playback controls to the Lock Screen and Control Center. Full-screen lyrics and Live Activity / Dynamic Island show the current lyric line. iOS does not expose a custom lyric field for third-party Control Center media cards, so lyrics are shown through those dedicated views instead.

## Source model

The project is separate from third-party source scripts. The bundled Kumone / NetEase adapter uses the existing web backend routes for search, lyrics, artwork and multi-source fallback; standalone iOS calls the same resolver through native URLSession. An LX User API can still be installed from a URL or local `.js` file for `musicUrl`, `lyric` and `pic` resolution. Common LX Music / MusicFree methods and fields are supported, including `search`, `getMediaSource`, `getLyric`, `name`, `singer`, `pic` and `interval`.

## Local development

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

## Unsigned iOS IPA

Building iOS requires macOS 26 and Xcode 26:

```bash
pnpm build:ipa
# → ios/build/unsigned/Moumusic-unsigned.ipa
```

An unsigned IPA cannot be installed directly on an iPhone. Sign it with an Apple development certificate and provisioning profile first.

## Release

Current stable release: [Moumusic v1.10.17](https://github.com/jiajia2222/moumusic-ios/releases/tag/v1.10.17).
