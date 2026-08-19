package fm.cassette.app

import java.text.SimpleDateFormat
import java.util.Collections
import java.util.Date
import java.util.Locale

object CassetteDiagnostics {
    val logs = Collections.synchronizedList(mutableListOf<String>())
    val activityEvents = Collections.synchronizedList(mutableListOf<String>())

    @Volatile var serviceAlive: Boolean = false
    @Volatile var serviceId: Int = 0
    @Volatile var playerAlive: Boolean = false
    @Volatile var playerId: Int = 0
    @Volatile var playerState: String = "UNKNOWN"
    @Volatile var isPlaying: Boolean = false
    @Volatile var playWhenReady: Boolean = false
    @Volatile var currentPositionMs: Long = 0L
    @Volatile var durationMs: Long = 0L
    @Volatile var currentTrackId: String? = null
    @Volatile var controllerConnected: Boolean = false
    @Volatile var lastActivityState: String = "NONE"

    fun log(tag: String, message: String) {
        val time = SimpleDateFormat("HH:mm:ss.SSS", Locale.US).format(Date())
        val entry = "[$time][$tag] $message"
        logs.add(entry)
        if (logs.size > 300) {
            logs.removeAt(0)
        }
    }

    fun recordActivity(event: String) {
        val time = SimpleDateFormat("HH:mm:ss.SSS", Locale.US).format(Date())
        lastActivityState = event
        val entry = "[$time][ACTIVITY] $event"
        activityEvents.add(entry)
        if (activityEvents.size > 50) {
            activityEvents.removeAt(0)
        }
        log("ACTIVITY", event)
    }
}
