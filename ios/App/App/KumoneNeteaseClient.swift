import Foundation

/**
 * The small native transport used by the bundled Kumone source.
 * It intentionally covers only public search, playback URL and lyric calls;
 * account state remains in the existing web app and LX User API layer.
 */
enum KumoneNeteaseClient {
    enum ClientError: LocalizedError {
        case invalidResponse
        case upstream(Int)
        case api(Int, String?)
        case malformed

        var errorDescription: String? {
            switch self {
            case .invalidResponse: return "NetEase returned an invalid response"
            case .upstream(let status): return "NetEase HTTP \(status)"
            case .api(let code, let message): return message ?? "NetEase API error \(code)"
            case .malformed: return "NetEase returned malformed data"
            }
        }
    }

    private static let userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"

    static func search(query: String, page: Int, limit: Int = 30) async throws -> [[String: Any]] {
        let root = try await request(
            path: "/cloudsearch/pc",
            mode: .eapi,
            payload: [
                "s": query,
                "type": 1,
                "limit": limit,
                "offset": max(0, page - 1) * limit,
                "total": true,
            ]
        )
        let result = root["result"] as? [String: Any]
        return result?["songs"] as? [[String: Any]] ?? []
    }

    static func media(id: String, quality: String) async throws -> [String: Any]? {
        let level: String
        switch quality {
        case "128": level = "standard"
        case "192": level = "higher"
        case "320": level = "exhigh"
        case "740": level = "lossless"
        default: level = "hires"
        }
        let root = try await request(
            path: "/song/enhance/player/url/v1",
            mode: .eapi,
            payload: ["ids": "[\(id)]", "level": level, "encodeType": "flac"]
        )
        return (root["data"] as? [[String: Any]])?.first
    }

    static func lyric(id: String) async throws -> [String: Any] {
        let payload: [String: Any] = [
            "id": Int(id) ?? 0,
            "cp": false,
            "lv": 0,
            "kv": 0,
            "tv": 0,
            "rv": 0,
            "yv": 0,
            "ytv": 0,
            "yrv": 0,
        ]
        let first = try? await request(path: "/song/lyric/v1", mode: .weapi, payload: payload)
        if let first,
           hasLyrics(first) {
            return first
        }
        return try await request(
            path: "/song/lyric",
            mode: .weapi,
            payload: ["id": Int(id) ?? 0, "lv": -1, "kv": -1, "tv": -1, "rv": -1]
        )
    }

    private static func hasLyrics(_ object: [String: Any]) -> Bool {
        let lrc = (object["lrc"] as? [String: Any])?["lyric"] as? String
        let yrc = (object["yrc"] as? [String: Any])?["lyric"] as? String
        return !(lrc?.isEmpty ?? true) || !(yrc?.isEmpty ?? true)
    }

    private enum RequestMode {
        case weapi
        case eapi
    }

    private static func request(
        path: String,
        mode: RequestMode,
        payload: [String: Any]
    ) async throws -> [String: Any] {
        let json = try JSONSerialization.data(withJSONObject: payload)
        let fields: [String: String]
        let url: URL
        switch mode {
        case .weapi:
            fields = KumoneNeteaseCrypto.weapi(payload: json)
            url = URL(string: "https://music.163.com/weapi\(path)")!
        case .eapi:
            fields = KumoneNeteaseCrypto.eapi(apiPath: "/api\(path)", payload: json)
            url = URL(string: "https://interface.music.163.com/eapi\(path)")!
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 15
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        request.setValue("https://music.163.com", forHTTPHeaderField: "Referer")
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.httpBody = encodeForm(fields)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw ClientError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else { throw ClientError.upstream(http.statusCode) }
        guard let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { throw ClientError.malformed }
        if let code = object["code"] as? Int, code != 200 {
            throw ClientError.api(code, object["message"] as? String ?? object["msg"] as? String)
        }
        return object
    }

    private static func encodeForm(_ fields: [String: String]) -> Data {
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._~")
        let body = fields.map { key, value in
            "\(key)=\(value.addingPercentEncoding(withAllowedCharacters: allowed) ?? value)"
        }.joined(separator: "&")
        return Data(body.utf8)
    }
}
