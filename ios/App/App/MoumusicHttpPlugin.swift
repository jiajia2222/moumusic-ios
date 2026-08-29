import Capacitor
import Foundation

/**
 * Small native transport used by LX User API scripts.
 *
 * The WebView player still owns audio playback. This plugin only moves source
 * API requests through URLSession when iOS CORS would otherwise reject them.
 */
@objc(MoumusicHttpPlugin)
public final class MoumusicHttpPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MoumusicHttpPlugin"
    public let jsName = "MoumusicHttp"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise)
    ]

    @objc public func request(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString),
              ["http", "https"].contains(url.scheme?.lowercased()) else {
            call.reject("A valid http(s) URL is required")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = (call.getString("method") ?? "GET").uppercased()
        if let headers = call.getObject("headers") as? [String: Any] {
            for (key, value) in headers {
                if let stringValue = value as? String {
                    request.setValue(stringValue, forHTTPHeaderField: key)
                }
            }
        }
        if let body = call.getString("data") {
            request.httpBody = body.data(using: .utf8)
        }
        let responseType = call.getString("responseType") ?? "text"

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error {
                call.reject(error.localizedDescription)
                return
            }
            guard let httpResponse = response as? HTTPURLResponse else {
                call.reject("The source returned an invalid HTTP response")
                return
            }

            var responseHeaders: [String: String] = [:]
            for (key, value) in httpResponse.allHeaderFields {
                responseHeaders[String(describing: key).lowercased()] = String(describing: value)
            }
            let payload = data ?? Data()
            let body = responseType == "base64"
                ? payload.base64EncodedString()
                : (String(data: payload, encoding: .utf8) ?? "")
            call.resolve([
                "status": httpResponse.statusCode,
                "headers": responseHeaders,
                "data": body
            ])
        }.resume()
    }
}
