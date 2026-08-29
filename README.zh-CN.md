# Moumusic

[简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Português](README.pt.md)

Moumusic 是由 moumou 打造的轻量音乐播放器，可在浏览器和 iOS App 中使用。支持搜索、播放、收藏、歌词、歌单和下载，无需登录。

## 功能

- 首页可以切换已安装的音源平台；全新安装默认提供 Kumone / NetEase 音源与 LX Music / Kuwo 适配器。
- 支持 LX Music User API 和 MusicFree 兼容音源导入；User API 可通过网址或本地 `.js` 文件安装，应用不会捆绑第三方音源脚本。
- 支持 128、192、320、740 和 999 kbps 等音质档位，可按音源能力获取高解析或无损音质。
- 支持 LRC、翻译歌词及 LX/Kumone 风格 YRC 逐字歌词解析；全屏歌词会显示翻译，iOS Live Activity / Dynamic Island 会同步当前歌词。
- 支持 Kumone 风格的网易云/GD 多源搜索、解灰与回退；也支持网易云热歌榜等官方榜单。

## iOS 播放体验

iOS 原生版本支持后台播放，并向锁定画面和控制中心提供封面、歌名、歌手、专辑、播放进度及播放控制。全屏歌词和 Live Activity / Dynamic Island 会显示当前歌词行。由于 iOS 不提供第三方自定义控制中心歌词字段，歌词不会直接绘制在系统控制中心媒体卡片中。

## 音源机制

项目与第三方音源脚本分离。应用内置 Kumone / NetEase 音源：网页端使用后端的搜索、歌词、封面、GD 多源解灰接口，iOS 端在没有后端时通过原生 URLSession 直连同一套解析链路；另有 LX Music / Kuwo 适配器。也可以在“设置”中安装你有权使用的 LX User API（网址或本地 `.js` 文件）。LX User API 常见的 `musicUrl`、`lyric`、`pic`、`name`、`singer`、`interval` 等字段已做兼容。

歌词显示采用 Kumone 的分层歌词思路：原文、翻译/罗马音和逐字时间轴在同一条播放时间线上合并。音源适配器按 Kumone 的 NetEase/GD 回退顺序实现，保留现有 Web 前端、Cloudflare/Node 后端和 iOS 壳，以便同时兼容 LX User API 与旧版 CommonJS/MusicFree 音源。

## 本地开发

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

## iOS 未签名 IPA

iOS 构建需要 macOS 26 和 Xcode 26：

```bash
pnpm build:ipa
# → ios/build/unsigned/Moumusic-unsigned.ipa
```

未签名 IPA 不能直接安装到 iPhone，必须使用 Apple 开发者证书和 provisioning profile 完成签名。

## 版本

当前稳定版：[Moumusic v1.10.18](https://github.com/jiajia2222/moumusic-ios/releases/tag/v1.10.18)。
