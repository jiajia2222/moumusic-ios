# Moumusic

[简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Português](README.pt.md)

Moumusic は moumou が開発する軽量音楽プレーヤーです。ブラウザと iOS App で検索、再生、お気に入り、歌詞、プレイリスト、ダウンロードを利用できます。ログインは不要です。

## 機能

- ホーム画面から、インストール済みの NetEase Cloud Music、QQ Music、Kuwo、Luoxue などの音源を切り替えられます。
- 設定画面から LX Music / MusicFree 互換の音源を追加できます。第三者の音源は App に同梱されません。
- 音源が対応する範囲で 128、192、320、740、999 kbps などの音質を選択できます。
- 歌詞解析、全画面歌詞、お気に入り、プレイリストのインポート・エクスポート、ダウンロード、端末間の音源同期に対応します。
- 音源が提供する場合、NetEase Cloud Music の人気曲ランキングなど公式チャートを表示します。

## iOS の再生体験

ネイティブ iOS App はバックグラウンド再生に対応し、ロック画面とコントロールセンターにアートワーク、曲名、アーティスト、アルバム、再生位置、操作ボタンを表示します。全画面歌詞と Live Activity / Dynamic Island では現在の歌詞行を表示します。iOS は第三者がコントロールセンターのメディアカードに独自の歌詞欄を追加する API を提供していません。

## 音源の仕組み

プロジェクトと音源は分離されており、リポジトリや IPA に音源ファイルは含まれません。設定画面で音源 URL を貼り付けてインストールしてください。`search`、`getMediaSource`、`getLyric`、`name`、`singer`、`pic`、`interval` など、LX Music / MusicFree の一般的な形式に対応します。

## ローカル開発

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

## 署名なし iOS IPA

iOS のビルドには macOS 26 と Xcode 26 が必要です。

```bash
pnpm build:ipa
# → ios/build/unsigned/Moumusic-unsigned.ipa
```

署名なし IPA は iPhone に直接インストールできません。Apple の開発者証明書と provisioning profile で署名してください。

## リリース

最新の安定版：[Moumusic v1.10.18](https://github.com/jiajia2222/moumusic-ios/releases/tag/v1.10.18)。
