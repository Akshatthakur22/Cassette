package fm.cassette.app

import android.app.PendingIntent
import android.content.Intent
import android.util.Log
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

class CassettePlaybackService : MediaSessionService() {

    companion object {
        private const val TAG = "CassettePlaybackService"
    }

    private var mediaSession: MediaSession? = null
    private var player: ExoPlayer? = null

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "[SERVICE] onCreate starting")

        val audioAttributes = AudioAttributes.Builder()
            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
            .setUsage(C.USAGE_MEDIA)
            .build()

        val exoPlayer = ExoPlayer.Builder(this)
            .setAudioAttributes(audioAttributes, true)
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_LOCAL)
            .build()

        player = exoPlayer

        exoPlayer.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                val stateStr = when (playbackState) {
                    Player.STATE_IDLE -> "STATE_IDLE"
                    Player.STATE_BUFFERING -> "STATE_BUFFERING"
                    Player.STATE_READY -> "STATE_READY"
                    Player.STATE_ENDED -> "STATE_ENDED"
                    else -> "UNKNOWN($playbackState)"
                }
                Log.d(TAG, "[SERVICE] player state changed -> $stateStr, isPlaying=${exoPlayer.isPlaying}, pos=${exoPlayer.currentPosition}ms")
            }

            override fun onIsPlayingChanged(isPlaying: Boolean) {
                Log.d(TAG, "[SERVICE] player isPlaying changed -> $isPlaying, item=${exoPlayer.currentMediaItem?.mediaId}, pos=${exoPlayer.currentPosition}ms")
            }

            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                Log.d(TAG, "[SERVICE] mediaItem transition -> item=${mediaItem?.mediaId}, title=${mediaItem?.mediaMetadata?.title}, reason=$reason")
            }

            override fun onPlayerError(error: PlaybackException) {
                Log.e(TAG, "[SERVICE] player error -> ${error.message}", error)
            }
        })

        // Build PendingIntent for Session Activity so notification tap opens MainActivity
        val sessionActivityIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            sessionActivityIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        mediaSession = MediaSession.Builder(this, exoPlayer)
            .setId("CassetteMediaSession")
            .setSessionActivity(pendingIntent)
            .build()

        Log.d(TAG, "[SERVICE] onCreate complete, MediaSession created")
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
        Log.d(TAG, "[SERVICE] onGetSession requested by package: ${controllerInfo.packageName}")
        return mediaSession
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        Log.d(TAG, "[SERVICE] onTaskRemoved called")
        val currentP = player
        if (currentP == null || !currentP.playWhenReady || currentP.mediaItemCount == 0) {
            Log.d(TAG, "[SERVICE] Stopping self on task removed because not playing")
            stopSelf()
        } else {
            Log.d(TAG, "[SERVICE] Keeping service active during task removal because audio is playing")
        }
    }

    override fun onDestroy() {
        Log.d(TAG, "[SERVICE] onDestroy starting")
        mediaSession?.run {
            player.release()
            release()
            mediaSession = null
        }
        player = null
        Log.d(TAG, "[SERVICE] onDestroy complete")
        super.onDestroy()
    }
}
