package fm.cassette.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import com.getcapacitor.BridgeActivity
import com.getcapacitor.WebViewListener

class MainActivity : BridgeActivity() {

    companion object {
        private const val TAG = "CassetteMainActivity"
    }

    private var errorLayout: LinearLayout? = null
    private var errorTextView: TextView? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        Log.d(TAG, "[ACTIVITY] onCreate")
        CassetteDiagnostics.recordActivity("onCreate")
        registerPlugin(CassettePlaybackPlugin::class.java)
        super.onCreate(savedInstanceState)

        // Configure WebView settings for Next.js web application compatibility
        val webView = bridge?.webView
        if (webView != null) {
            webView.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                allowFileAccess = true
                allowContentAccess = true
            }

            setupErrorOverlay(webView)
            setupWebViewDiagnosticListeners(webView)
        }
    }

    private fun setupErrorOverlay(webView: WebView) {
        errorLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFF171717.toInt()) // Neutral-900
            setPadding(64, 120, 64, 64)
            visibility = View.GONE

            val titleView = TextView(this@MainActivity).apply {
                text = "📼 Cassette Loading Error"
                textSize = 20f
                setTextColor(0xFFF59E0B.toInt()) // Amber-500
                setPadding(0, 0, 0, 24)
            }
            addView(titleView)

            errorTextView = TextView(this@MainActivity).apply {
                textSize = 14f
                setTextColor(0xFFD4D4D4.toInt()) // Neutral-300
                setPadding(0, 0, 0, 32)
            }
            addView(errorTextView)

            val retryButton = Button(this@MainActivity).apply {
                text = "🔄 Retry Loading"
                setBackgroundColor(0xFFF59E0B.toInt())
                setTextColor(0xFF000000.toInt())
                setOnClickListener {
                    errorLayout?.visibility = View.GONE
                    webView.reload()
                }
            }
            addView(retryButton)
        }

        addContentView(
            errorLayout,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
            )
        )
    }

    private fun setupWebViewDiagnosticListeners(webView: WebView) {
        bridge?.addWebViewListener(object : WebViewListener() {
            override fun onPageStarted(webView: WebView?) {
                val url = webView?.url ?: "unknown"
                Log.d(TAG, "[WEBVIEW] onPageStarted: $url")
                CassetteDiagnostics.log("WEBVIEW", "Page load started: $url")
            }

            override fun onPageLoaded(webView: WebView?) {
                val url = webView?.url ?: "unknown"
                Log.d(TAG, "[WEBVIEW] onPageLoaded: $url")
                CassetteDiagnostics.log("WEBVIEW", "Page loaded successfully: $url")
                runOnUiThread {
                    errorLayout?.visibility = View.GONE
                }
            }

            override fun onReceivedError(webView: WebView?) {
                val url = webView?.url ?: "unknown"
                val msg = "Web resource error loading: $url"
                Log.e(TAG, "[WEBVIEW] $msg")
                CassetteDiagnostics.log("WEBVIEW-ERROR", msg)
            }

            override fun onReceivedHttpError(webView: WebView?) {
                val url = webView?.url ?: "unknown"
                val msg = "HTTP error loading: $url"
                Log.e(TAG, "[WEBVIEW] $msg")
                CassetteDiagnostics.log("WEBVIEW-ERROR", msg)
            }
        })
    }

    override fun onStart() {
        super.onStart()
        Log.d(TAG, "[ACTIVITY] onStart")
        CassetteDiagnostics.recordActivity("onStart")
    }

    override fun onResume() {
        super.onResume()
        Log.d(TAG, "[ACTIVITY] onResume")
        CassetteDiagnostics.recordActivity("onResume")
    }

    override fun onPause() {
        super.onPause()
        Log.d(TAG, "[ACTIVITY] onPause - Activity entering background")
        CassetteDiagnostics.recordActivity("onPause (entering background)")
    }

    override fun onStop() {
        super.onStop()
        Log.d(TAG, "[ACTIVITY] onStop - Activity stopped")
        CassetteDiagnostics.recordActivity("onStop (stopped)")
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "[ACTIVITY] onDestroy")
        CassetteDiagnostics.recordActivity("onDestroy")
    }
}
