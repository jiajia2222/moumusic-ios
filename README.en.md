# Moumusic

[简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Português](README.pt.md)

Moumusic is a lightweight music player built by moumou for the browser and iOS. It supports search, playback, favourites, lyrics, playlists and downloads without requiring an account.

## Features

- Use a Kumone-inspired dark red interface with artwork shelves, a floating player and immersive lyrics; source switching and home recommendation settings live in Settings.
- Clean installs register no built-in music source. Import your own LX Music User API or MusicFree-compatible source from a URL or local `.js` file.
- Choose Standard 128, High 192, Very High 320, Lossless FLAC or Hi-Res FLAC; the selected source decides what is actually available.
- Parse LRC, translated lyrics and LX/Kumone-style YRC word timings; full-screen lyrics show translations and iOS Live Activity / Dynamic Island follows the active line.
- Search, recommendations, playback and lyrics are dispatched only to sources that you imported and enabled.

## iOS playback

The native iOS app supports background playback and sends artwork, title, artist, album, progress and playback controls to the Lock Screen and Control Center. Full-screen lyrics and Live Activity / Dynamic Island show the current lyric line. iOS does not expose a custom lyric field for third-party Control Center media cards, so lyrics are shown through those dedicated views instead.

## Source model

The project is separate from third-party source scripts. It does not register Kumone, LX, Kuwo or any other platform source at startup; search, playback URLs, lyrics and artwork come from sources the user imports and enables in Settings. Common LX Music / MusicFree methods and fields are supported, including `search`, `getMediaSource`, `getLyric`, `name`, `singer`, `pic` and `interval`.

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

Current stable release: [Moumusic v1.10.18](https://github.com/jiajia2222/moumusic-ios/releases/tag/v1.10.18).
