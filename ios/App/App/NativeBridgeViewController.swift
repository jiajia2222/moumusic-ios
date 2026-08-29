import Capacitor

/**
 * App-specific bridge registration.
 *
 * Capacitor's iOS platform does not auto-discover application-local plugins.
 * Registering after the bridge is created keeps the plugin available to the
 * bundled WebView without requiring a separate npm plugin package.
 */
final class NativeBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(BackgroundPlaybackPlugin())
        bridge?.registerPluginInstance(MoumusicHttpPlugin())
    }
}
