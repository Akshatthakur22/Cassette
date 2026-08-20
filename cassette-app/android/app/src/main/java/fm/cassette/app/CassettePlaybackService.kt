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
        try {
            val sId = System.identityHashCode(this)
            Log.d(TAG, "[SERVICE-LIFECYCLE] onCreate starting, serviceId=$sId")
            CassetteDiagnostics.serviceAlive = true
            CassetteDiagnostics.serviceId = sId
            CassetteDiagnostics.log("SERVICE-LIFECYCLE", "onCreate: serviceId=$sId")

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
            val pId = System.identityHashCode(exoPlayer)
            CassetteDiagnostics.playerAlive = true
            CassetteDiagnostics.playerId = pId

            Log.d(TAG, "[SERVICE-EXOPLAYER] ExoPlayer instance created, playerId=$pId")
            CassetteDiagnostics.log("SERVICE-EXOPLAYER", "ExoPlayer created, playerId=$pId")

            exoPlayer.addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(playbackState: Int) {
                    val stateStr = when (playbackState) {
                        Player.STATE_IDLE -> "STATE_IDLE"
                        Player.STATE_BUFFERING -> "STATE_BUFFERING"
                        Player.STATE_READY -> "STATE_READY"
                        Player.STATE_ENDED -> "STATE_ENDED"
                        else -> "UNKNOWN($playbackState)"
                    }
                    CassetteDiagnostics.playerState = stateStr
                    CassetteDiagnostics.currentPositionMs = exoPlayer.currentPosition
                    CassetteDiagnostics.durationMs = if (exoPlayer.duration > 0) exoPlayer.duration else 0L

                    val msg = "onPlaybackStateChanged -> $stateStr (isPlaying=${exoPlayer.isPlaying}, playWhenReady=${exoPlayer.playWhenReady}, pos=${exoPlayer.currentPosition}ms, dur=${exoPlayer.duration}ms, playerId=$pId)"
                    Log.d(TAG, "[SERVICE-EXOPLAYER] $msg")
                    CassetteDiagnostics.log("SERVICE-EXOPLAYER", msg)
                }

                override fun onIsPlayingChanged(isPlaying: Boolean) {
                    CassetteDiagnostics.isPlaying = isPlaying
                    CassetteDiagnostics.currentPositionMs = exoPlayer.currentPosition
                    CassetteDiagnostics.currentTrackId = exoPlayer.currentMediaItem?.mediaId

                    val msg = "onIsPlayingChanged -> isPlaying=$isPlaying (track=${exoPlayer.currentMediaItem?.mediaId}, playWhenReady=${exoPlayer.playWhenReady}, pos=${exoPlayer.currentPosition}ms, playerId=$pId)"
                    Log.d(TAG, "[SERVICE-EXOPLAYER] $msg")
                    CassetteDiagnostics.log("SERVICE-EXOPLAYER", msg)
                }

                override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) {
                    CassetteDiagnostics.playWhenReady = playWhenReady
                    val reasonStr = when (reason) {
                        Player.PLAY_WHEN_READY_CHANGE_REASON_USER_REQUEST -> "USER_REQUEST"
                        Player.PLAY_WHEN_READY_CHANGE_REASON_AUDIO_FOCUS_LOSS -> "AUDIO_FOCUS_LOSS"
                        Player.PLAY_WHEN_READY_CHANGE_REASON_AUDIO_BECOMING_NOISY -> "AUDIO_BECOMING_NOISY"
                        Player.PLAY_WHEN_READY_CHANGE_REASON_REMOTE -> "REMOTE"
                        Player.PLAY_WHEN_READY_CHANGE_REASON_END_OF_MEDIA_ITEM -> "END_OF_MEDIA_ITEM"
                        else -> "OTHER($reason)"
                    }
                    val msg = "onPlayWhenReadyChanged -> playWhenReady=$playWhenReady, reason=$reasonStr"
                    Log.d(TAG, "[SERVICE-EXOPLAYER] $msg")
                    CassetteDiagnostics.log("SERVICE-EXOPLAYER", msg)
                }

                override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                    CassetteDiagnostics.currentTrackId = mediaItem?.mediaId
                    val msg = "onMediaItemTransition -> trackId=${mediaItem?.mediaId}, title=${mediaItem?.mediaMetadata?.title}, reason=$reason"
                    Log.d(TAG, "[SERVICE-EXOPLAYER] $msg")
                    CassetteDiagnostics.log("SERVICE-EXOPLAYER", msg)
                }

                override fun onPlayerError(error: PlaybackException) {
                    val msg = "onPlayerError -> ${error.message}"
                    Log.e(TAG, "[SERVICE-EXOPLAYER] $msg", error)
                    CassetteDiagnostics.log("SERVICE-ERROR", "$msg\nStack:\n${Log.getStackTraceString(error)}")
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

            val sesId = System.identityHashCode(mediaSession)
            Log.d(TAG, "[SERVICE-LIFECYCLE] onCreate complete, MediaSession created with sessionId=$sesId")
            CassetteDiagnostics.log("SERVICE-LIFECYCLE", "MediaSession created, sessionId=$sesId")
        } catch (e: Exception) {
            Log.e(TAG, "[SERVICE-LIFECYCLE] onCreate failed: ${e.message}", e)
            CassetteDiagnostics.serviceAlive = false
            CassetteDiagnostics.playerAlive = false
            CassetteDiagnostics.log("SERVICE-ERROR", "onCreate failed: ${e.message}\n${Log.getStackTraceString(e)}")
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val msg = "onStartCommand: intent=$intent, flags=$flags, startId=$startId"
        Log.d(TAG, "[SERVICE-LIFECYCLE] $msg")
        CassetteDiagnostics.log("SERVICE-LIFECYCLE", msg)
        return super.onStartCommand(intent, flags, startId)
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
        val msg = "onGetSession requested by package: ${controllerInfo.packageName}, uid: ${controllerInfo.uid}"
        Log.d(TAG, "[SERVICE-LIFECYCLE] $msg")
        CassetteDiagnostics.log("SERVICE-LIFECYCLE", msg)
        return mediaSession
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        val currentP = player
        if (currentP == null || !currentP.playWhenReady || currentP.mediaItemCount == 0) {
            val msg = "onTaskRemoved: Stopping self because player not active"
            Log.d(TAG, "[SERVICE-LIFECYCLE] $msg")
            CassetteDiagnostics.log("SERVICE-LIFECYCLE", msg)
            stopSelf()
        } else {
            val msg = "onTaskRemoved: Keeping service active because audio is playing"
            Log.d(TAG, "[SERVICE-LIFECYCLE] $msg")
            CassetteDiagnostics.log("SERVICE-LIFECYCLE", msg)
        }
    }

    override fun onDestroy() {
        val stack = Log.getStackTraceString(Throwable())
        val msg = "onDestroy starting for serviceId=${System.identityHashCode(this)}\nStack:\n$stack"
        Log.d(TAG, "[SERVICE-LIFECYCLE] $msg")
        CassetteDiagnostics.log("SERVICE-LIFECYCLE", msg)
        CassetteDiagnostics.serviceAlive = false
        CassetteDiagnostics.playerAlive = false

        mediaSession?.run {
            player.release()
            release()
            mediaSession = null
        }
        player = null
        Log.d(TAG, "[SERVICE-LIFECYCLE] onDestroy complete")
        CassetteDiagnostics.log("SERVICE-LIFECYCLE", "onDestroy complete")
        super.onDestroy()
    }
}
