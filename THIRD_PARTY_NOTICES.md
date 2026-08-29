# Third-party reference notices

Moumusic keeps music sources user-managed. No provider script from the projects
below is bundled in the app.

## Kumone

Reference: <https://github.com/missuo/kumone>

Moumusic includes an adapted native NetEase source path based on these Kumone
source files and implementation ideas:

- `Sources/Kumone/Core/API/NeteaseCrypto.swift`
- `Sources/Kumone/Core/API/NeteaseClient.swift`
- `Sources/Kumone/Core/API/NeteaseAPI.swift`
- `Sources/Kumone/Core/Player/UnblockService.swift`
- `Sources/Kumone/Core/Models/LyricsParser.swift`

Kumone's SwiftUI navigation, immersive now-playing, lyric and settings
interactions are also used as design and behavior references for the Capacitor
UI. Kumone is licensed under the GNU Lesser General Public License v3.0 only;
the applicable license texts are included at `third_party/kumone/LICENSE` and
`third_party/kumone/COPYING`. The adapted files remain replaceable source files
in this repository.

## LX Music Mobile

Reference: <https://github.com/lyswhut/lx-music-mobile>

LX Music Mobile is licensed under the Apache License 2.0. Its typed search
navigation, User API lifecycle, quality names, request-header behavior and
player/cache expectations were used to make the Moumusic plugin boundary
compatible. The built-in provider scripts are intentionally not shipped;
users add the LX User API or legacy source they are authorized to use in
Settings.

The LX compatibility layer is an independent implementation of the public
source protocol and continues to support the existing CommonJS/MusicFree
plugin format. The complete Apache license text is available in the upstream
LX repository.
