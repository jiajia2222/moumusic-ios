import Capacitor
import Foundation

/**
 * Native Kumone source bridge.
 *
 * The provider is deliberately narrow: search, playback URL and lyrics. The
 * Web frontend keeps the same Plugin interface, while this bridge lets the
 * standalone iOS build use Kumone's native NetEase request path without a
 * backend or WebView CORS. Third-party LX/MusicFree plugins remain independent.
 */
@objc(KumoneSourcePlugin)
public final class KumoneSourcePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KumoneSourcePlugin"
    public let jsName = "KumoneSource"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "search", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "media", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "lyric", returnType: CAPPluginReturnPromise),
    ]

    @objc public func search(_ call: CAPPluginCall) {
        let query = call.getString("query") ?? ""
        let page = max(1, call.getInt("page") ?? 1)
        let limit = min(50, max(1, call.getInt("limit") ?? 30))
        guard !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            call.resolve(["data": [], "isEnd": true])
            return
        }
        Task {
            do {
                let songs = try await KumoneNeteaseClient.search(query: query, page: page, limit: limit)
                let data = songs.map(Self.normalizeSong)
                await MainActor.run { call.resolve(["data": data, "isEnd": data.count < limit]) }
            } catch {
                await MainActor.run { call.reject(error.localizedDescription) }
            }
        }
    }

    @objc public func media(_ call: CAPPluginCall) {
        let id = call.getString("id") ?? ""
        let quality = call.getString("quality") ?? "320"
        guard !id.isEmpty else {
            call.reject("Missing NetEase song id")
            return
        }
        Task {
            do {
                let data = try await KumoneNeteaseClient.media(id: id, quality: quality)
                await MainActor.run {
                    guard let data, let url = data["url"] as? String, !url.isEmpty else {
                        call.resolve(["url": ""])
                        return
                    }
                    call.resolve([
                        "url": url,
                        "source": "netease",
                        "quality": data["level"] as? String ?? quality,
                        "bitrate": data["br"] as? Int ?? 0,
                    ])
                }
            } catch {
                await MainActor.run { call.reject(error.localizedDescription) }
            }
        }
    }

    @objc public func lyric(_ call: CAPPluginCall) {
        let id = call.getString("id") ?? ""
        guard !id.isEmpty else {
            call.resolve(["lyric": ""])
            return
        }
        Task {
            do {
                let object = try await KumoneNeteaseClient.lyric(id: id)
                await MainActor.run { call.resolve(Self.normalizeLyric(object)) }
            } catch {
                await MainActor.run { call.reject(error.localizedDescription) }
            }
        }
    }

    private static func normalizeSong(_ raw: [String: Any]) -> [String: Any] {
        let artists = (raw["ar"] as? [[String: Any]] ?? raw["artists"] as? [[String: Any]] ?? [])
            .compactMap { $0["name"] as? String }
            .joined(separator: " / ")
        let album = raw["al"] as? [String: Any] ?? raw["album"] as? [String: Any] ?? [:]
        let id = String(raw["id"] as? Int ?? 0)
        return [
            "id": id,
            "title": raw["name"] as? String ?? "",
            "artist": artists,
            "album": album["name"] as? String ?? "",
            "artwork": album["picUrl"] as? String ?? "",
            "duration": (raw["dt"] as? Int ?? raw["duration"] as? Int ?? 0) / 1000,
            "platform": "Kumone / NetEase",
            "subSource": "netease",
            "lyricId": id,
            "picId": id,
            "type": "music",
        ]
    }

    private static func normalizeLyric(_ object: [String: Any]) -> [String: Any] {
        func lyric(_ key: String) -> String {
            (object[key] as? [String: Any])?["lyric"] as? String ?? ""
        }
        return [
            "lyric": lyric("lrc"),
            "tlyric": lyric("tlyric"),
            "rlyric": lyric("romalrc"),
            "yrc": lyric("yrc"),
        ]
    }
}
