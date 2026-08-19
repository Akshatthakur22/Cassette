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
        Log.d(TAG, "[SERVICE-LIFECYCLE] onCreate starting, serviceId=${System.identityHashCode(this)}")

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

        Log.d(TAG, "[SERVICE-EXOPLAYER] ExoPlayer instance created, playerId=${System.identityHashCode(exoPlayer)}")

        exoPlayer.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                val stateStr = when (playbackState) {
                    Player.STATE_IDLE -> "STATE_IDLE"
                    Player.STATE_BUFFERING -> "STATE_BUFFERING"
                    Player.STATE_READY -> "STATE_READY"
                    Player.STATE_ENDED -> "STATE_ENDED"
                    else -> "UNKNOWN($playbackState)"
                }
                Log.d(TAG, "[SERVICE-EXOPLAYER] onPlaybackStateChanged -> $stateStr (isPlaying=${exoPlayer.isPlaying}, playWhenReady=${exoPlayer.playWhenReady}, pos=${exoPlayer.currentPosition}ms, dur=${exoPlayer.duration}ms, playerId=${System.identityHashCode(exoPlayer)})")
            }

            override fun onIsPlayingChanged(isPlaying: Boolean) {
                Log.d(TAG, "[SERVICE-EXOPLAYER] onIsPlayingChanged -> isPlaying=$isPlaying (track=${exoPlayer.currentMediaItem?.mediaId}, playWhenReady=${exoPlayer.playWhenReady}, pos=${exoPlayer.currentPosition}ms, playerId=${System.identityHashCode(exoPlayer)})")
            }

            override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) {
                val reasonStr = when (reason) {
                    Player.PLAY_WHEN_READY_CHANGE_REASON_USER_REQUEST -> "USER_REQUEST"
                    Player.PLAY_WHEN_READY_CHANGE_REASON_AUDIO_FOCUS_LOSS -> "AUDIO_FOCUS_LOSS"
                    Player.PLAY_WHEN_READY_CHANGE_REASON_AUDIO_BECOMING_NOISY -> "AUDIO_BECOMING_NOISY"
                    Player.PLAY_WHEN_READY_CHANGE_REASON_REMOTE -> "REMOTE"
                    Player.PLAY_WHEN_READY_CHANGE_REASON_END_OF_MEDIA_ITEM -> "END_OF_MEDIA_ITEM"
                    else -> "OTHER($reason)"
                }
                Log.d(TAG, "[SERVICE-EXOPLAYER] onPlayWhenReadyChanged -> playWhenReady=$playWhenReady, reason=$reasonStr")
            }

            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                Log.d(TAG, "[SERVICE-EXOPLAYER] onMediaItemTransition -> trackId=${mediaItem?.mediaId}, title=${mediaItem?.mediaMetadata?.title}, reason=$reason")
            }

            override fun onPlayerError(error: PlaybackException) {
                Log.e(TAG, "[SERVICE-EXOPLAYER] onPlayerError -> ${error.message}", error)
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

        Log.d(TAG, "[SERVICE-LIFECYCLE] onCreate complete, MediaSession created with sessionId=${System.identityHashCode(mediaSession)}")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "[SERVICE-LIFECYCLE] onStartCommand called: intent=$intent, flags=$flags, startId=$startId")
        return super.onStartCommand(intent, flags, startId)
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
        Log.d(TAG, "[SERVICE-LIFECYCLE] onGetSession requested by package: ${controllerInfo.packageName}, uid: ${controllerInfo.uid}")
        return mediaSession
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        Log.d(TAG, "[SERVICE-LIFECYCLE] onTaskRemoved called")
        val currentP = player
        if (currentP == null || !currentP.playWhenReady || currentP.mediaItemCount == 0) {
            Log.d(TAG, "[SERVICE-LIFECYCLE] Stopping self on task removed because not playing")
            stopSelf()
        } else {
            Log.d(TAG, "[SERVICE-LIFECYCLE] Keeping service active during task removal because audio is playing")
        }
    }

    override fun onDestroy() {
        Log.d(TAG, "[SERVICE-LIFECYCLE] onDestroy starting for serviceId=${System.identityHashCode(this)}\nStack:\n${Log.getStackTraceString(Throwable())}")
        mediaSession?.run {
            player.release()
            release()
            mediaSession = null
        }
        player = null
        Log.d(TAG, "[SERVICE-LIFECYCLE] onDestroy complete")
        super.onDestroy()
    }
}
