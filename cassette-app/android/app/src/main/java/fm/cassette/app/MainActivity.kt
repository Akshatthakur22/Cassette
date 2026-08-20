package fm.cassette.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.view.View
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
        // Global Uncaught Exception Handler to capture any native startup crash and display CrashActivity
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e(TAG, "[UNCAUGHT-CRASH] Crash in thread ${thread.name}: ${throwable.message}", throwable)
            try {
                CrashActivity.start(applicationContext, throwable)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to launch CrashActivity: ${e.message}", e)
                defaultHandler?.uncaughtException(thread, throwable)
            }
        }

        Log.d(TAG, "[ACTIVITY] onCreate starting")
        CassetteDiagnostics.recordActivity("onCreate")

        try {
            // Register CassettePlayback custom plugin with Capacitor Bridge
            registerPlugin(CassettePlaybackPlugin::class.java)
        } catch (t: Throwable) {
            Log.e(TAG, "[ACTIVITY] Error registering CassettePlaybackPlugin: ${t.message}", t)
            CassetteDiagnostics.log("ACTIVITY-ERROR", "registerPlugin failed: ${t.message}")
        }

        try {
            super.onCreate(savedInstanceState)
        } catch (t: Throwable) {
            Log.e(TAG, "[ACTIVITY] Error in super.onCreate: ${t.message}", t)
            CrashActivity.start(this, t)
            return
        }

        // Configure WebView settings for Next.js web application compatibility
        try {
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
        } catch (t: Throwable) {
            Log.e(TAG, "[ACTIVITY] Error configuring WebView: ${t.message}", t)
            CassetteDiagnostics.log("ACTIVITY-ERROR", "WebView config error: ${t.message}")
        }
    }

    private fun setupErrorOverlay(webView: WebView) {
        try {
            errorLayout = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setBackgroundColor(0xFF171717.toInt())
                setPadding(64, 120, 64, 64)
                visibility = View.GONE

                val titleView = TextView(this@MainActivity).apply {
                    text = "📼 Cassette Loading Error"
                    textSize = 20f
                    setTextColor(0xFFF59E0B.toInt())
                    setPadding(0, 0, 0, 24)
                }
                addView(titleView)

                errorTextView = TextView(this@MainActivity).apply {
                    textSize = 14f
                    setTextColor(0xFFD4D4D4.toInt())
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
        } catch (t: Throwable) {
            Log.w(TAG, "Failed to attach error overlay view: ${t.message}")
        }
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
