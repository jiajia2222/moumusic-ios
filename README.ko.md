# Moumusic

[简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Português](README.pt.md)

Moumusic은 moumou가 만든 가벼운 음악 플레이어로 브라우저와 iOS App에서 사용할 수 있습니다. 검색, 재생, 즐겨찾기, 가사, 플레이리스트와 다운로드를 지원하며 로그인이 필요하지 않습니다.

## 기능

- 홈 화면에서 설치된 NetEase Cloud Music, QQ Music, Kuwo, Luoxue 등의 음원을 전환할 수 있습니다.
- 설정에서 LX Music / MusicFree 호환 음원을 가져올 수 있습니다. 타사 음원은 앱에 포함되지 않습니다.
- 음원이 제공하는 범위에서 128, 192, 320, 740, 999 kbps 등의 음질을 선택할 수 있습니다.
- 가사 분석, 전체 화면 가사, 즐겨찾기, 플레이리스트 가져오기·내보내기, 다운로드, 기기 간 음원 동기화를 지원합니다.
- 음원이 제공하면 NetEase Cloud Music 인기곡 차트 같은 공식 차트를 표시합니다.

## iOS 재생

네이티브 iOS 앱은 백그라운드 재생을 지원하고 잠금 화면과 제어 센터에 앨범 아트, 곡명, 아티스트, 앨범, 재생 위치와 제어 버튼을 제공합니다. 전체 화면 가사와 Live Activity / Dynamic Island에서 현재 가사를 표시합니다. iOS는 타사 앱이 제어 센터 미디어 카드에 사용자 정의 가사 필드를 추가하는 API를 제공하지 않습니다.

## 음원 방식

프로젝트와 음원을 분리하여 저장소나 IPA에 음원 파일을 포함하지 않습니다. 설정에서 음원 URL을 붙여넣어 설치하세요. `search`, `getMediaSource`, `getLyric`, `name`, `singer`, `pic`, `interval` 등 일반적인 LX Music / MusicFree 형식을 지원합니다.

## 로컬 개발

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

## 서명되지 않은 iOS IPA

iOS 빌드에는 macOS 26과 Xcode 26이 필요합니다.

```bash
pnpm build:ipa
# → ios/build/unsigned/Moumusic-unsigned.ipa
```

서명되지 않은 IPA는 iPhone에 직접 설치할 수 없습니다. Apple 개발자 인증서와 provisioning profile로 서명해야 합니다.

## 릴리스

현재 안정 버전: [Moumusic v1.10.19](https://github.com/jiajia2222/moumusic-ios/releases/tag/v1.10.19).
