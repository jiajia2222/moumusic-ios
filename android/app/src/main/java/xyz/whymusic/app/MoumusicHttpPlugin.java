package xyz.whymusic.app;

import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Native HTTP escape hatch for source APIs used by the web frontend.
 *
 * WebView fetch is still attempted first. This plugin is only used when an
 * LX/Kumone/Kugou/Kuwo endpoint rejects the WebView's CORS request.
 */
@CapacitorPlugin(name = "MoumusicHttp")
public class MoumusicHttpPlugin extends Plugin {
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @PluginMethod
    public void request(PluginCall call) {
        String urlString = call.getString("url", "");
        if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
            call.reject("A valid http(s) URL is required");
            return;
        }

        executor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(urlString).openConnection();
                connection.setRequestMethod(call.getString("method", "GET").toUpperCase());
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(20000);
                connection.setInstanceFollowRedirects(true);

                JSObject requestHeaders = call.getObject("headers");
                if (requestHeaders != null) {
                    Iterator<String> keys = requestHeaders.keys();
                    while (keys.hasNext()) {
                        String key = keys.next();
                        connection.setRequestProperty(key, requestHeaders.optString(key, ""));
                    }
                }

                String body = call.getString("data", null);
                if (body != null && !body.isEmpty()
                        && !"GET".equalsIgnoreCase(connection.getRequestMethod())
                        && !"HEAD".equalsIgnoreCase(connection.getRequestMethod())) {
                    connection.setDoOutput(true);
                    byte[] bytes = body.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    try (OutputStream output = connection.getOutputStream()) {
                        output.write(bytes);
                    }
                }

                int status = connection.getResponseCode();
                InputStream stream = status >= 400
                        ? connection.getErrorStream() : connection.getInputStream();
                byte[] payload = stream == null ? new byte[0] : readAll(stream);
                String responseType = call.getString("responseType", "text");
                String data = "base64".equalsIgnoreCase(responseType)
                        ? Base64.encodeToString(payload, Base64.NO_WRAP)
                        : new String(payload, java.nio.charset.StandardCharsets.UTF_8);

                JSObject headers = new JSObject();
                for (Map.Entry<String, List<String>> entry : connection.getHeaderFields().entrySet()) {
                    if (entry.getKey() == null || entry.getValue() == null) continue;
                    headers.put(entry.getKey().toLowerCase(), String.join(",", entry.getValue()));
                }
                JSObject result = new JSObject();
                result.put("status", status);
                result.put("headers", headers);
                result.put("data", data);
                call.resolve(result);
            } catch (Exception error) {
                call.reject(error.getMessage() == null ? "Native HTTP request failed" : error.getMessage());
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    private static byte[] readAll(InputStream stream) throws java.io.IOException {
        try (InputStream input = stream; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            return output.toByteArray();
        }
    }
}
