package fm.cassette.app

import android.content.ComponentName
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.net.Uri
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.MoreExecutors

@CapacitorPlugin(name = "CassettePlayback")
class CassettePlaybackPlugin : Plugin() {

    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var mediaController: MediaController? = null
    private val handler = Handler(Looper.getMainLooper())
    private var progressRunnable: Runnable? = null

    override fun load() {
        super.load()
        initMediaController()
    }

    private fun initMediaController() {
        val context: Context = context ?: return
        val sessionToken = SessionToken(context, ComponentName(context, CassettePlaybackService::class.java))
        controllerFuture = MediaController.Builder(context, sessionToken).buildAsync()
        controllerFuture?.addListener({
            try {
                mediaController = controllerFuture?.get()
                setupPlayerListener()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }, MoreExecutors.directExecutor())
    }

    private void setupPlayerListener() {
        val player = mediaController ?: return
        player.addListener(object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                val data = JSObject()
                data.put("type", if (isPlaying) "play" else "pause")
                data.put("isPlaying", isPlaying)
                data.put("currentTime", player.currentPosition / 1000.0)
                data.put("duration", if (player.duration > 0) player.duration / 1000.0 else 0.0)
                notifyListeners("playbackEvent", data)

                if (isPlaying) {
                  startProgressPolling()
                } else {
                  stopProgressPolling()
                }
            }

            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_ENDED) {
                    val data = JSObject()
                    data.put("type", "ended")
                    data.put("isPlaying", false)
                    notifyListeners("playbackEvent", data)
                    stopProgressPolling()
                } else if (playbackState == Player.STATE_BUFFERING) {
                    val data = JSObject()
                    data.put("type", "buffering")
                    data.put("isBuffering", true)
                    notifyListeners("playbackEvent", data)
                }
            }

            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                if (mediaItem != null) {
                    val data = JSObject()
                    data.put("type", "trackChanged")
                    data.put("trackId", mediaItem.mediaId)
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
                    val data = JSObject()
                    data.put("type", "timeUpdate")
                    data.put("currentTime", player.currentPosition / 1000.0)
                    data.put("duration", if (player.duration > 0) player.duration / 1000.0 else 0.0)
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

    @PluginMethod
    fun play(call: PluginCall) {
        val player = mediaController
        if (player == null) {
            call.reject("MediaController not initialized")
            return
        }

        val url = call.getString("url")
        val trackId = call.getString("id") ?: ""
        val title = call.getString("title") ?: "Cassette Voice Track"
        val artist = call.getString("artist") ?: "Cassette"
        val artworkUrl = call.getString("artworkUrl")

        if (!url.isNullOrEmpty()) {
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

            player.setMediaItem(mediaItem)
            player.prepare()
        }

        player.play()
        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        mediaController?.pause()
        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun seek(call: PluginCall) {
        val seconds = call.getDouble("seconds") ?: 0.0
        mediaController?.seekTo((seconds * 1000).toLong())
        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun next(call: PluginCall) {
        mediaController?.seekToNextMediaItem()
        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun previous(call: PluginCall) {
        mediaController?.seekToPreviousMediaItem()
        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun setQueue(call: PluginCall) {
        val queueArray = call.getArray("queue")
        val index = call.getInt("index") ?: 0
        val player = mediaController

        if (player != null && queueArray != null) {
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
                player.setMediaItems(mediaItems, Math.max(0, Math.min(index, mediaItems.size - 1)), 0)
                player.prepare()
            }
        }

        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun getState(call: PluginCall) {
        val player = mediaController
        val ret = JSObject()
        ret.put("isPlaying", player?.isPlaying ?: false)
        ret.put("currentTime", if (player != null) player.currentPosition / 1000.0 else 0.0)
        ret.put("duration", if (player != null && player.duration > 0) player.duration / 1000.0 else 0.0)
        ret.put("isBuffering", player?.playbackState == Player.STATE_BUFFERING)
        call.resolve(ret)
    }

    @PluginMethod
    fun destroy(call: PluginCall) {
        stopProgressPolling()
        mediaController?.stop()
        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }
}
