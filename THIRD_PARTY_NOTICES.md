# Third-party notices

## Kumone

Moumusic includes an adapted native NetEase source path based on the following
Kumone source files and implementation ideas:

- `Sources/Kumone/Core/API/NeteaseCrypto.swift`
- `Sources/Kumone/Core/API/NeteaseClient.swift`
- `Sources/Kumone/Core/API/NeteaseAPI.swift`
- `Sources/Kumone/Core/Player/UnblockService.swift`
- `Sources/Kumone/Core/Models/LyricsParser.swift`

Upstream project: https://github.com/missuo/kumone

Kumone is licensed under **LGPL-3.0-only**. The applicable license text is
included at `third_party/kumone/LICENSE`. The adapted files in
`ios/App/App/KumoneNeteaseCrypto.swift`, `KumoneNeteaseClient.swift` and
`KumoneSourcePlugin.swift` remain replaceable source files in this repository.

The LX Music User API compatibility layer is an independent implementation of
the public source protocol and continues to support the existing CommonJS /
MusicFree plugin format.
