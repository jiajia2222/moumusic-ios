# Moumusic

[简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Português](README.pt.md)

Moumusic is a lightweight music player built by moumou for the browser and iOS. It supports search, playback, favourites, lyrics, playlists and downloads without requiring an account.

## Features

- Switch between installed sources such as NetEase Cloud Music, QQ Music, Kuwo and Luoxue from the home screen.
- Import LX Music / MusicFree-compatible sources from Settings. Third-party sources are not bundled with the app.
- Choose quality levels including 128, 192, 320, 740 and 999 kbps, depending on what the selected source provides.
- Parse lyrics, open full-screen lyrics, manage favourites, import and export playlists, download tracks and sync sources between devices.
- Show official charts such as NetEase Cloud Music hot songs when the installed source provides them.

## iOS playback

The native iOS app supports background playback and sends artwork, title, artist, album, progress and playback controls to the Lock Screen and Control Center. Full-screen lyrics and Live Activity / Dynamic Island show the current lyric line. iOS does not expose a custom lyric field for third-party Control Center media cards, so lyrics are shown through those dedicated views instead.

## Source model

The project is separate from its music sources and does not ship source files in the repository or IPA. Open Settings and paste a source URL to install one. Common LX Music / MusicFree methods and fields are supported, including `search`, `getMediaSource`, `getLyric`, `name`, `singer`, `pic` and `interval`.

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

Current stable release: [Moumusic v1.10.16](https://github.com/jiajia2222/moumusic-ios/releases/tag/v1.10.16).
