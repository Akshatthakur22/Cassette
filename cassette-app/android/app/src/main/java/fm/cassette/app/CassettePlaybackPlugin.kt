package fm.cassette.app

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.MoreExecutors

@CapacitorPlugin(name = "CassettePlayback")
class CassettePlaybackPlugin : Plugin() {

    companion object {
        private const val TAG = "CassettePlaybackPlugin"
    }

    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var mediaController: MediaController? = null
    private val handler = Handler(Looper.getMainLooper())
    private var progressRunnable: Runnable? = null
    private var isListenerAttached = false

    override fun load() {
        super.load()
        Log.d(TAG, "[PLUGIN-LIFECYCLE] load called")
        initMediaController()
    }

    private fun initMediaController(onReady: ((MediaController) -> Unit)? = null) {
        val context: Context = context ?: run {
            Log.e(TAG, "[PLUGIN-CONTROLLER] Context is null during initMediaController")
            return
        }

        if (mediaController != null && mediaController?.isConnected == true) {
            Log.d(TAG, "[PLUGIN-CONTROLLER] MediaController already connected, controllerId=${System.identityHashCode(mediaController)}")
            onReady?.invoke(mediaController!!)
            return
        }

        Log.d(TAG, "[PLUGIN-CONTROLLER] Binding SessionToken to CassettePlaybackService...")
        val sessionToken = SessionToken(context, ComponentName(context, CassettePlaybackService::class.java))
        controllerFuture = MediaController.Builder(context, sessionToken).buildAsync()
        controllerFuture?.addListener({
            try {
                val controller = controllerFuture?.get()
                if (controller != null && controller.isConnected) {
                    mediaController = controller
                    Log.d(TAG, "[PLUGIN-CONTROLLER] MediaController connected, controllerId=${System.identityHashCode(controller)}, isPlaying=${controller.isPlaying}, pos=${controller.currentPosition}ms")
                    setupPlayerListener()
                    onReady?.invoke(controller)
                } else {
                    Log.w(TAG, "[PLUGIN-CONTROLLER] MediaController future completed but controller is null or disconnected")
                }
            } catch (e: Exception) {
                Log.e(TAG, "[PLUGIN-CONTROLLER] Error connecting MediaController: ${e.message}\n${Log.getStackTraceString(e)}")
            }
        }, MoreExecutors.directExecutor())
    }

    private fun setupPlayerListener() {
        val player = mediaController ?: return
        if (isListenerAttached) return
        isListenerAttached = true

        Log.d(TAG, "[PLUGIN-CONTROLLER] Attaching Player.Listener to MediaController")
        player.addListener(object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                val posMs = player.currentPosition
                val durMs = player.duration
                Log.d(TAG, "[PLUGIN-EVENT] onIsPlayingChanged -> isPlaying=$isPlaying, pos=${posMs}ms, dur=${durMs}ms, trackId=${player.currentMediaItem?.mediaId}")

                val data = JSObject().apply {
                    put("type", if (isPlaying) "play" else "pause")
                    put("isPlaying", isPlaying)
                    put("currentTime", posMs / 1000.0)
                    put("duration", if (durMs > 0) durMs / 1000.0 else 0.0)
                    put("trackId", player.currentMediaItem?.mediaId)
                }
                notifyListeners("playbackEvent", data)

                if (isPlaying) {
                    startProgressPolling()
                } else {
                    stopProgressPolling()
                }
            }

            override fun onPlaybackStateChanged(playbackState: Int) {
                val stateName = when (playbackState) {
                    Player.STATE_IDLE -> "STATE_IDLE"
                    Player.STATE_BUFFERING -> "STATE_BUFFERING"
                    Player.STATE_READY -> "STATE_READY"
                    Player.STATE_ENDED -> "STATE_ENDED"
                    else -> "UNKNOWN($playbackState)"
                }
                Log.d(TAG, "[PLUGIN-EVENT] onPlaybackStateChanged -> $stateName")

                if (playbackState == Player.STATE_ENDED) {
                    val data = JSObject().apply {
                        put("type", "ended")
                        put("isPlaying", false)
                        put("currentTime", if (player.duration > 0) player.duration / 1000.0 else 0.0)
                        put("trackId", player.currentMediaItem?.mediaId)
                    }
                    notifyListeners("playbackEvent", data)
                    stopProgressPolling()
                } else if (playbackState == Player.STATE_BUFFERING) {
                    val data = JSObject().apply {
                        put("type", "buffering")
                        put("isBuffering", true)
                    }
                    notifyListeners("playbackEvent", data)
                }
            }

            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                Log.d(TAG, "[PLUGIN-EVENT] onMediaItemTransition -> trackId=${mediaItem?.mediaId}, title=${mediaItem?.mediaMetadata?.title}, reason=$reason")
                if (mediaItem != null) {
                    val data = JSObject().apply {
                        put("type", "trackChanged")
                        put("trackId", mediaItem.mediaId)
                    }
                    notifyListeners("playbackEvent", data)
                }
            }
        })
    }

    private fun startProgressPolling() {
        stopProgressPolling()
        progressRunnable = object : Runnable {
            override fun run() {
                val player = mediaController
                if (player != null && player.isPlaying) {
                    val posSec = player.currentPosition / 1000.0
                    val durSec = if (player.duration > 0) player.duration / 1000.0 else 0.0
                    val data = JSObject().apply {
                        put("type", "timeUpdate")
                        put("currentTime", posSec)
                        put("duration", durSec)
                        put("trackId", player.currentMediaItem?.mediaId)
                    }
                    notifyListeners("playbackEvent", data)
                    handler.postDelayed(this, 500)
                }
            }
        }
        handler.post(progressRunnable!!)
    }

    private fun stopProgressPolling() {
        progressRunnable?.let { handler.removeCallbacks(it) }
        progressRunnable = null
    }

    private fun withController(call: PluginCall, action: (MediaController) -> Unit) {
        val player = mediaController
        if (player != null && player.isConnected) {
            action(player)
        } else {
            Log.d(TAG, "[PLUGIN-CALL] MediaController not ready, awaiting connection...")
            initMediaController { controller ->
                action(controller)
            }
        }
    }

    @PluginMethod
    fun play(call: PluginCall) {
        val trackId = call.getString("id") ?: ""
        val url = call.getString("url")
        val title = call.getString("title") ?: "Cassette Voice Track"
        val artist = call.getString("artist") ?: "Cassette"
        val artworkUrl = call.getString("artworkUrl")

        Log.d(TAG, "[PLUGIN-CALL] play() called -> id=$trackId, url=$url, title=$title\nStack:\n${Log.getStackTraceString(Throwable())}")

        withController(call) { player ->
            val currentMediaId = player.currentMediaItem?.mediaId
            val isSameTrack = currentMediaId != null && currentMediaId == trackId
            val isPlayerIdleOrEnded = player.playbackState == Player.STATE_IDLE || player.playbackState == Player.STATE_ENDED

            if (isSameTrack && !isPlayerIdleOrEnded) {
                Log.d(TAG, "[PLUGIN-CALL] Track $trackId is already loaded in player at ${player.currentPosition}ms. Calling player.play() without modifying media items.")
                player.play()
            } else if (!url.isNullOrEmpty()) {
                Log.d(TAG, "[PLUGIN-CALL] Loading new track into ExoPlayer -> id=$trackId, url=$url")
                val metadataBuilder = MediaMetadata.Builder()
                    .setTitle(title)
                    .setArtist(artist)
                    .setAlbumTitle("Cassette")

                if (!artworkUrl.isNullOrEmpty()) {
                    metadataBuilder.setArtworkUri(Uri.parse(artworkUrl))
                }

                val mediaItem = MediaItem.Builder()
                    .setMediaId(trackId)
                    .setUri(url)
                    .setMediaMetadata(metadataBuilder.build())
                    .build()

                Log.d(TAG, "[PLUGIN-CALL] setMediaItem CALLED\n${Log.getStackTraceString(Throwable())}")
                player.setMediaItem(mediaItem)
                player.prepare()
                player.play()
            } else {
                Log.d(TAG, "[PLUGIN-CALL] Resuming existing player state (no URL payload)")
                player.play()
            }

            call.resolve(JSObject().put("success", true))
        }
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        Log.d(TAG, "[PLUGIN-CALL] pause() CALLED\nStack:\n${Log.getStackTraceString(Throwable())}")
        withController(call) { player ->
            player.pause()
            call.resolve(JSObject().put("success", true))
        }
    }

    @PluginMethod
    fun seek(call: PluginCall) {
        val seconds = call.getDouble("seconds") ?: 0.0
        Log.d(TAG, "[PLUGIN-CALL] seek() CALLED to ${seconds}s\nStack:\n${Log.getStackTraceString(Throwable())}")
        withController(call) { player ->
            player.seekTo((seconds * 1000).toLong())
            call.resolve(JSObject().put("success", true))
        }
    }

    @PluginMethod
    fun next(call: PluginCall) {
        Log.d(TAG, "[PLUGIN-CALL] next() CALLED")
        withController(call) { player ->
            if (player.hasNextMediaItem()) {
                player.seekToNextMediaItem()
            }
            call.resolve(JSObject().put("success", true))
        }
    }

    @PluginMethod
    fun previous(call: PluginCall) {
        Log.d(TAG, "[PLUGIN-CALL] previous() CALLED")
        withController(call) { player ->
            if (player.currentPosition > 3000) {
                player.seekTo(0)
            } else if (player.hasPreviousMediaItem()) {
                player.seekToPreviousMediaItem()
            }
            call.resolve(JSObject().put("success", true))
        }
    }

    @PluginMethod
    fun setQueue(call: PluginCall) {
        val queueArray = call.getArray("queue")
        val index = call.getInt("index") ?: 0
        Log.d(TAG, "[PLUGIN-CALL] setQueue() CALLED -> length=${queueArray?.length()}, index=$index\nStack:\n${Log.getStackTraceString(Throwable())}")

        withController(call) { player ->
            if (queueArray != null && queueArray.length() > 0) {
                val mediaItems = mutableListOf<MediaItem>()
                for (i in 0 until queueArray.length()) {
                    val obj = queueArray.getJSONObject(i)
                    val trackId = obj.optString("id", "")
                    val url = obj.optString("url", "")
                    val title = obj.optString("title", "Voice Track")
                    val artist = obj.optString("artist", "Cassette")

                    if (url.isNotEmpty()) {
                        val mediaItem = MediaItem.Builder()
                            .setMediaId(trackId)
                            .setUri(url)
                            .setMediaMetadata(
                                MediaMetadata.Builder()
                                    .setTitle(title)
                                    .setArtist(artist)
                                    .setAlbumTitle("Cassette")
                                    .build()
                            )
                            .build()
                        mediaItems.add(mediaItem)
                    }
                }

                if (mediaItems.isNotEmpty()) {
                    val targetTrackId = mediaItems.getOrNull(index)?.mediaId
                    val isAlreadySet = player.mediaItemCount == mediaItems.size &&
                            player.currentMediaItem?.mediaId == targetTrackId

                    if (isAlreadySet && player.playbackState != Player.STATE_IDLE) {
                        Log.d(TAG, "[PLUGIN-CALL] Queue already matches player items. Skipping setMediaItems() reset.")
                    } else {
                        Log.d(TAG, "[PLUGIN-CALL] setMediaItems CALLED with ${mediaItems.size} items\n${Log.getStackTraceString(Throwable())}")
                        player.setMediaItems(mediaItems, Math.max(0, Math.min(index, mediaItems.size - 1)), 0)
                        player.prepare()
                    }
                }
            }
            call.resolve(JSObject().put("success", true))
        }
    }

    @PluginMethod
    fun getState(call: PluginCall) {
        withController(call) { player ->
            val posSec = player.currentPosition / 1000.0
            val durSec = if (player.duration > 0) player.duration / 1000.0 else 0.0
            val currentTrackId = player.currentMediaItem?.mediaId

            Log.d(TAG, "[PLUGIN-CALL] getState() query -> isPlaying=${player.isPlaying}, pos=${posSec}s, dur=${durSec}s, trackId=$currentTrackId")

            val ret = JSObject().apply {
                put("isPlaying", player.isPlaying)
                put("currentTime", posSec)
                put("duration", durSec)
                put("isBuffering", player.playbackState == Player.STATE_BUFFERING)
                put("currentTrackId", currentTrackId)
            }
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun destroy(call: PluginCall) {
        Log.d(TAG, "[PLUGIN-CALL] destroy() CALLED\nStack:\n${Log.getStackTraceString(Throwable())}")
        stopProgressPolling()
        mediaController?.stop()
        call.resolve(JSObject().put("success", true))
    }
}
