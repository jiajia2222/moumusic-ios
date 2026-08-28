import ActivityKit

/** Shared state compiled into both the app and its Live Activity extension. */
@available(iOS 16.1, *)
public struct MoumouLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var title: String
        public var artist: String
        public var lyric: String
        public var artworkURL: String
        public var isPlaying: Bool
        public var positionSec: Double
        public var durationSec: Double

        public init(
            title: String,
            artist: String,
            lyric: String,
            artworkURL: String,
            isPlaying: Bool,
            positionSec: Double,
            durationSec: Double
        ) {
            self.title = title
            self.artist = artist
            self.lyric = lyric
            self.artworkURL = artworkURL
            self.isPlaying = isPlaying
            self.positionSec = positionSec
            self.durationSec = durationSec
        }
    }

    public var appName: String

    public init(appName: String = "Moumou") {
        self.appName = appName
    }
}
