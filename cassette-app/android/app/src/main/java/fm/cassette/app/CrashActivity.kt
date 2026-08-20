package fm.cassette.app

import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast

class CrashActivity : Activity() {

    companion object {
        const val EXTRA_ERROR_CLASS = "error_class"
        const val EXTRA_ERROR_MESSAGE = "error_message"
        const val EXTRA_ERROR_STACK = "error_stack"

        fun start(context: Context, t: Throwable) {
            val intent = Intent(context, CrashActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                putExtra(EXTRA_ERROR_CLASS, t.javaClass.name)
                putExtra(EXTRA_ERROR_MESSAGE, t.message ?: "No error message")
                putExtra(EXTRA_ERROR_STACK, android.util.Log.getStackTraceString(t))
            }
            context.startActivity(intent)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val errClass = intent.getStringExtra(EXTRA_ERROR_CLASS) ?: "UnknownException"
        val errMsg = intent.getStringExtra(EXTRA_ERROR_MESSAGE) ?: "No message"
        val errStack = intent.getStringExtra(EXTRA_ERROR_STACK) ?: "No stack trace"

        val fullReport = """
            CASSETTE NATIVE STARTUP CRASH REPORT
            ====================================
            Exception: $errClass
            Message: $errMsg
            
            Stack Trace:
            $errStack
        """.trimIndent()

        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFF121212.toInt())
            setPadding(48, 80, 48, 48)
        }

        val headerText = TextView(this).apply {
            text = "⚠️ Cassette Startup Error"
            textSize = 22f
            setTypeface(null, Typeface.BOLD)
            setTextColor(0xFFF59E0B.toInt()) // Amber
            setPadding(0, 0, 0, 24)
        }
        rootLayout.addView(headerText)

        val descText = TextView(this).apply {
            text = "An uncaught native exception occurred during startup:"
            textSize = 14f
            setTextColor(0xFFE5E5E5.toInt())
            setPadding(0, 0, 0, 16)
        }
        rootLayout.addView(descText)

        val copyButton = Button(this).apply {
            text = "📋 Copy Error Details"
            setBackgroundColor(0xFFF59E0B.toInt())
            setTextColor(0xFF000000.toInt())
            setTypeface(null, Typeface.BOLD)
            setOnClickListener {
                val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                val clip = ClipData.newPlainText("Cassette Crash Log", fullReport)
                clipboard.setPrimaryClip(clip)
                Toast.makeText(this@CrashActivity, "Copied to clipboard!", Toast.LENGTH_SHORT).show()
            }
        }
        rootLayout.addView(copyButton)

        val restartButton = Button(this).apply {
            text = "🔄 Restart App"
            setBackgroundColor(0xFF262626.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener {
                val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                launchIntent?.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(launchIntent)
                finish()
            }
        }
        rootLayout.addView(restartButton)

        val scrollView = ScrollView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
            ).apply {
                setMargins(0, 24, 0, 0)
            }
        }

        val stackTextView = TextView(this).apply {
            text = fullReport
            textSize = 12f
            setTypeface(Typeface.MONOSPACE)
            setTextColor(0xFFEF4444.toInt()) // Red
            setBackgroundColor(0xFF1F1F1F.toInt())
            setPadding(24, 24, 24, 24)
        }
        scrollView.addView(stackTextView)
        rootLayout.addView(scrollView)

        setContentView(rootLayout)
    }
}
