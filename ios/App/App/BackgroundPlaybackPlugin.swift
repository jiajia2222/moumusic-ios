import ActivityKit
import AVFoundation
import Capacitor
import MediaPlayer
import UIKit

/**
 * Native iOS media session for the WebView player.
 *
 * MPNowPlayingInfoCenter supplies the lock screen and Control Center with the
 * supported metadata (artwork, title, artist, album and progress). Lyrics are
 * carried to the Live Activity because iOS does not expose a custom lyric field
 * in Now Playing.
 */
@objc(BackgroundPlaybackPlugin)
public final class BackgroundPlaybackPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BackgroundPlaybackPlugin"
    public let jsName = "BackgroundPlayback"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]

    private var artworkTask: URLSessionDataTask?
    private var currentArtworkURL = ""

    @available(iOS 16.1, *)
    private var liveActivity: Activity<MoumouLiveActivityAttributes>?

    override public func load() {
        configureRemoteCommands()
    }

    @objc public func update(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? "Moumou"
        let artist = call.getString("artist") ?? ""
        let album = call.getString("album") ?? "Moumou"
        let artworkURL = call.getString("artworkUrl") ?? ""
        let lyric = call.getString("lyric") ?? ""
        let playing = call.getBool("playing") ?? false
        let position = max(0, call.getDouble("positionSec") ?? 0)
        let duration = max(0, call.getDouble("durationSec") ?? 0)

        DispatchQueue.main.async { [weak self] in
            guard let self else {
                call.resolve()
                return
            }
            self.updateNowPlaying(
                title: title,
                artist: artist,
                album: album,
                artworkURL: artworkURL,
                playing: playing,
                position: position,
                duration: duration
            )
            self.updateLiveActivity(
                title: title,
                artist: artist,
                lyric: lyric,
                artworkURL: artworkURL,
                playing: playing,
                position: position,
                duration: duration
            )
            if playing {
                try? AVAudioSession.sharedInstance().setActive(true)
            }
            call.resolve()
        }
    }

    @objc public func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.artworkTask?.cancel()
            self?.artworkTask = nil
            self?.currentArtworkURL = ""
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            self?.endLiveActivity()
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            call.resolve()
        }
    }

    private func configureRemoteCommands() {
        let commandCenter = MPRemoteCommandCenter.shared()
        commandCenter.playCommand.isEnabled = true
        commandCenter.pauseCommand.isEnabled = true
        commandCenter.nextTrackCommand.isEnabled = true
        commandCenter.previousTrackCommand.isEnabled = true
        commandCenter.changePlaybackPositionCommand.isEnabled = true

        commandCenter.playCommand.addTarget { [weak self] _ in
            self?.emitControl(action: "play")
            return .success
        }
        commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.emitControl(action: "pause")
            return .success
        }
        commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            self?.emitControl(action: "next")
            return .success
        }
        commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            self?.emitControl(action: "previous")
            return .success
        }
        commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let event = event as? MPChangePlaybackPositionCommandEvent else {
                return .commandFailed
            }
            self?.emitControl(action: "seek", seekTime: event.positionTime)
            return .success
        }
    }

    private func emitControl(action: String, seekTime: Double? = nil) {
        var data: [String: Any] = ["action": action]
        if let seekTime {
            data["seekTime"] = seekTime
        }
        notifyListeners("control", data: data)
    }

    private func updateNowPlaying(
        title: String,
        artist: String,
        album: String,
        artworkURL: String,
        playing: Bool,
        position: Double,
        duration: Double
    ) {
        var info: [String: Any] = [
            MPNowPlayingInfoPropertyMediaType: NSNumber(value: MPNowPlayingInfoMediaType.audio.rawValue),
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: artist,
            MPMediaItemPropertyAlbumTitle: album,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: position,
            MPNowPlayingInfoPropertyPlaybackRate: playing ? 1.0 : 0.0
        ]
        if duration > 0 {
            info[MPMediaItemPropertyPlaybackDuration] = duration
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info

        artworkTask?.cancel()
        currentArtworkURL = artworkURL
        guard let url = URL(string: artworkURL), !artworkURL.isEmpty else { return }
        artworkTask = URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            guard let data, let image = UIImage(data: data) else { return }
            DispatchQueue.main.async {
                guard let self, self.currentArtworkURL == artworkURL else { return }
                var latest = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
                latest[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                MPNowPlayingInfoCenter.default().nowPlayingInfo = latest
            }
        }
        artworkTask?.resume()
    }

    private func updateLiveActivity(
        title: String,
        artist: String,
        lyric: String,
        artworkURL: String,
        playing: Bool,
        position: Double,
        duration: Double
    ) {
        guard #available(iOS 16.1, *) else { return }
        let state = MoumouLiveActivityAttributes.ContentState(
            title: title,
            artist: artist,
            lyric: lyric,
            artworkURL: artworkURL,
            isPlaying: playing,
            positionSec: position,
            durationSec: duration
        )
        Task { @MainActor [weak self] in
            guard let self else { return }
            if let activity = self.liveActivity {
                await activity.update(using: state)
                return
            }
            guard playing else { return }
            do {
                self.liveActivity = try Activity.request(
                    attributes: MoumouLiveActivityAttributes(),
                    contentState: state,
                    pushType: nil
                )
            } catch {
                NSLog("[Moumou] Live Activity unavailable: %@", error.localizedDescription)
            }
        }
    }

    private func endLiveActivity() {
        guard #available(iOS 16.1, *) else { return }
        guard let activity = liveActivity else { return }
        liveActivity = nil
        Task { @MainActor in
            await activity.end(using: nil, dismissalPolicy: .immediate)
        }
    }
}
