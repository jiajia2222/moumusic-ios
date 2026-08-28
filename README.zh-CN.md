# Moumusic

[简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Português](README.pt.md)

Moumusic 是由 moumou 打造的轻量音乐播放器，可在浏览器和 iOS App 中使用。支持搜索、播放、收藏、歌词、歌单和下载，无需登录。

## 功能

- 首页可以切换已安装的音源平台，包括网易云音乐、QQ 音乐、酷我和落雪等。
- 支持 LX Music / MusicFree 兼容音源导入；音源由用户在“设置”页添加，应用不会捆绑第三方音源。
- 支持 128、192、320、740 和 999 kbps 等音质档位，可按音源能力获取高解析或无损音质。
- 支持歌词解析、全屏歌词、收藏、歌单导入导出、下载和跨设备音源同步。
- 支持网易云热歌榜等官方榜单；具体榜单由已安装的音源返回。

## iOS 播放体验

iOS 原生版本支持后台播放，并向锁定画面和控制中心提供封面、歌名、歌手、专辑、播放进度及播放控制。全屏歌词和 Live Activity / Dynamic Island 会显示当前歌词行。由于 iOS 不提供第三方自定义控制中心歌词字段，歌词不会直接绘制在系统控制中心媒体卡片中。

## 音源机制

项目与音源分离，不在仓库或 IPA 中内置音源。打开应用后进入“设置”，粘贴自己的音源 URL 即可安装。兼容常见的 LX Music / MusicFree 方法和字段，例如 `search`、`getMediaSource`、`getLyric`、`name`、`singer`、`pic` 和 `interval`。

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

当前稳定版：[Moumusic v1.10.16](https://github.com/jiajia2222/moumusic-ios/releases/tag/v1.10.16)。
