"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface TrackItem {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  thumbnailUrl?: string;
  provider: "youtube" | "voice";
  providerTrackId: string;
  durationSec?: number;
  personalNote?: string;
  side?: "A" | "B";
}

export type PlayerStatus = "IDLE" | "LOADING" | "READY" | "PLAYING" | "PAUSED" | "ENDED";

export interface PlaybackControllerOptions {
  tracks: TrackItem[];
  initialIndex?: number;
  playerDivId?: string;
  onTrackChange?: (index: number) => void;
  onSideChange?: (side: "A" | "B") => void;
  onSideADone?: () => void;
  onTapeDone?: () => void;
}

export function usePlaybackController({
  tracks,
  initialIndex = 0,
  playerDivId = "yt-player-container",
  onTrackChange,
  onSideChange,
  onSideADone,
  onTapeDone,
}: PlaybackControllerOptions) {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>("IDLE");
  const [ytReady, setYtReady] = useState<boolean>(false);
  const [trackWarning, setTrackWarning] = useState<string | null>(null);

  const currentTrack = tracks[currentIndex] || null;

  // Refs to avoid unnecessary effect re-triggers
  const playerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const currentIndexRef = useRef<number>(currentIndex);
  const tracksRef = useRef<TrackItem[]>(tracks);
  const tickRef = useRef<any>(null);
  const apiReadyRef = useRef<boolean>(false);
  const initPendingRef = useRef<boolean>(false);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);

  // Update duration when track changes
  useEffect(() => {
    if (currentTrack?.durationSec) {
      setDuration(currentTrack.durationSec);
    } else {
      setDuration(0);
    }
    setCurrentTime(0);
    setTrackWarning(null);
  }, [currentTrack?.id, currentTrack?.durationSec]);

  // Diagnostic logger
  const logDiagnostics = useCallback((msg: string, extra: Record<string, any> = {}) => {
    console.debug(`[PlaybackController] ${msg}`, {
      videoId: currentTrack?.providerTrackId,
      playerStatus,
      visibilityState: typeof document !== "undefined" ? document.visibilityState : "unknown",
      hasFocus: typeof document !== "undefined" ? document.hasFocus() : false,
      currentTime,
      duration,
      timestamp: new Date().toISOString(),
      ...extra,
    });
  }, [currentTrack?.providerTrackId, playerStatus, currentTime, duration]);

  // 1. Load YouTube IFrame API script safely once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (apiReadyRef.current) return;
    if (window.YT?.Player) {
      apiReadyRef.current = true;
      setYtReady(true);
      return;
    }

    if (!document.getElementById("yt-iframe-script")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-script";
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.defer = true;
      document.head.appendChild(tag);
    }

    const prevFn = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true;
      setYtReady(true);
      prevFn?.();
    };

    const timer = setTimeout(() => {
      if (!apiReadyRef.current && window.YT?.Player) {
        apiReadyRef.current = true;
        setYtReady(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  // 2. Initialize YouTube Player
  const createPlayer = useCallback((videoId: string) => {
    if (playerRef.current || initPendingRef.current) return;
    if (!videoId || videoId === "undefined") return;
    const el = document.getElementById(playerDivId);
    if (!el || !window.YT?.Player) return;

    initPendingRef.current = true;
    try {
      playerRef.current = new window.YT.Player(playerDivId, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady(event: any) {
            initPendingRef.current = false;
            setPlayerStatus("READY");
            try {
              event.target.setVolume(100);
              event.target.unMute();
              const dur = event.target.getDuration?.();
              if (dur && dur > 0) setDuration(Math.round(dur));
            } catch (e) {
              console.warn("[PlaybackController] Error setting volume on ready:", e);
            }
            if (isPlayingRef.current) {
              event.target.playVideo();
            }
          },
          onStateChange(event: any) {
            // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
            if (event.data === 1) { // PLAYING
              setPlayerStatus("PLAYING");
              setIsPlaying(true);
              const dur = event.target.getDuration?.();
              if (dur && dur > 0) setDuration(Math.round(dur));
            } else if (event.data === 2) { // PAUSED
              setPlayerStatus("PAUSED");
              setIsPlaying(false);
            } else if (event.data === 0) { // ENDED
              setPlayerStatus("ENDED");
              handleNextTrack();
            } else if (event.data === 3) { // BUFFERING
              setPlayerStatus("LOADING");
            }
          },
          onError(event: any) {
            console.warn(`[PlaybackController] YouTube error (${event.data}) for track:`, currentTrack?.title);
            setTrackWarning("Track unavailable. Skipping to next...");
            setTimeout(() => {
              setTrackWarning(null);
              handleNextTrack();
            }, 2000);
          },
        },
      });
    } catch (e) {
      initPendingRef.current = false;
      console.error("[PlaybackController] Player instantiation failed:", e);
    }
  }, [playerDivId, currentTrack?.title]);

  // 3. Load or Cue Video on Track Switch
  useEffect(() => {
    if (!currentTrack) return;

    if (currentTrack.provider === "youtube") {
      if (ytReady && !playerRef.current && currentTrack.providerTrackId) {
        createPlayer(currentTrack.providerTrackId);
      } else if (playerRef.current && currentTrack.providerTrackId) {
        try {
          if (isPlayingRef.current && typeof playerRef.current.loadVideoById === "function") {
            playerRef.current.loadVideoById(currentTrack.providerTrackId);
          } else if (typeof playerRef.current.cueVideoById === "function") {
            playerRef.current.cueVideoById(currentTrack.providerTrackId);
          }
        } catch (e) {
          console.warn("[PlaybackController] Error switching YouTube video:", e);
        }
      }
    } else if (currentTrack.provider === "voice" && audioRef.current) {
      const audioUrl = `/voice-recordings/${currentTrack.providerTrackId}.webm`;
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      if (isPlayingRef.current) {
        audioRef.current.play().catch((err) => console.error("[PlaybackController] Voice play error:", err));
      }
    }
  }, [currentTrack?.id, ytReady, createPlayer]);

  // 4. Handle Play / Pause State Commands
  const play = useCallback(() => {
    setIsPlaying(true);
    isPlayingRef.current = true;

    if (currentTrack?.provider === "youtube" && playerRef.current) {
      try {
        playerRef.current.unMute?.();
        playerRef.current.setVolume?.(100);
        playerRef.current.playVideo?.();
      } catch (e) {
        console.error("[PlaybackController] playVideo failed:", e);
      }
    } else if (currentTrack?.provider === "voice" && audioRef.current) {
      audioRef.current.play().catch((e) => console.error("[PlaybackController] Voice audio play failed:", e));
    }
  }, [currentTrack?.provider]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;

    if (currentTrack?.provider === "youtube" && playerRef.current) {
      try {
        playerRef.current.pauseVideo?.();
      } catch (e) {
        console.error("[PlaybackController] pauseVideo failed:", e);
      }
    } else if (currentTrack?.provider === "voice" && audioRef.current) {
      audioRef.current.pause();
    }
  }, [currentTrack?.provider]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  // 5. Seek Handler (User-Initiated)
  const seekToRatio = useCallback((ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    const activeDur = duration || currentTrack?.durationSec || 0;
    if (activeDur <= 0) return;

    const targetSec = clamped * activeDur;
    setCurrentTime(targetSec);

    if (currentTrack?.provider === "youtube" && playerRef.current) {
      try {
        playerRef.current.seekTo?.(targetSec, true);
      } catch (e) {
        console.error("[PlaybackController] YouTube seekTo failed:", e);
      }
    } else if (currentTrack?.provider === "voice" && audioRef.current) {
      try {
        audioRef.current.currentTime = targetSec;
      } catch (e) {
        console.error("[PlaybackController] Audio currentTime seek failed:", e);
      }
    }
  }, [duration, currentTrack]);

  // 6. Track Transition Handlers
  const handleNextTrack = useCallback(() => {
    const list = tracksRef.current;
    const curr = currentIndexRef.current;
    if (curr + 1 < list.length) {
      const prevTrack = list[curr];
      const nextTrack = list[curr + 1];

      if (prevTrack.side === "A" && nextTrack.side === "B") {
        pause();
        onSideADone?.();
        return;
      }

      const nextIdx = curr + 1;
      setCurrentIndex(nextIdx);
      onTrackChange?.(nextIdx);
      if (nextTrack.side) onSideChange?.(nextTrack.side);
      if (isPlayingRef.current) {
        setTimeout(() => play(), 100);
      }
    } else {
      pause();
      onTapeDone?.();
    }
  }, [pause, onSideADone, onTrackChange, onSideChange, onTapeDone, play]);

  const handlePrevTrack = useCallback(() => {
    const list = tracksRef.current;
    const curr = currentIndexRef.current;
    const prevIdx = Math.max(0, curr - 1);
    setCurrentIndex(prevIdx);
    onTrackChange?.(prevIdx);
    if (list[prevIdx]?.side) onSideChange?.(list[prevIdx].side!);
    if (isPlayingRef.current) {
      setTimeout(() => play(), 100);
    }
  }, [onTrackChange, onSideChange, play]);

  const selectTrack = useCallback((index: number) => {
    if (index >= 0 && index < tracks.length) {
      setCurrentIndex(index);
      onTrackChange?.(index);
      if (tracks[index]?.side) onSideChange?.(tracks[index].side!);
      play();
    }
  }, [tracks, onTrackChange, onSideChange, play]);

  // 7. Time Update & Progress Polling Loop
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!isPlaying) return;

    tickRef.current = setInterval(() => {
      try {
        let elapsed = 0;
        let dur = duration || currentTrack?.durationSec || 0;

        if (currentTrack?.provider === "youtube" && playerRef.current) {
          elapsed = playerRef.current.getCurrentTime?.() ?? 0;
          const ytDur = playerRef.current.getDuration?.();
          if (ytDur && ytDur > 0) {
            dur = Math.round(ytDur);
            if (dur !== duration) setDuration(dur);
          }
        } else if (currentTrack?.provider === "voice" && audioRef.current) {
          elapsed = audioRef.current.currentTime || 0;
          const voiceDur = audioRef.current.duration;
          if (voiceDur && !isNaN(voiceDur) && isFinite(voiceDur) && voiceDur > 0) {
            dur = Math.round(voiceDur);
            if (dur !== duration) setDuration(dur);
          }
        }

        if (dur > 0) {
          setCurrentTime(elapsed);
        }
      } catch (e) {
        console.error("[PlaybackController] Error during time update tick:", e);
      }
    }, 500);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isPlaying, currentTrack, duration]);

  // 8. Media Session API Synchronization
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (!currentTrack) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      return;
    }

    try {
      // Set metadata
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist || "Unknown Artist",
        album: currentTrack.album || "CASSETTE Mixtape",
        artwork: currentTrack.thumbnailUrl
          ? [{ src: currentTrack.thumbnailUrl, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });

      // Update state honestly
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

      // Position state update
      if (duration > 0 && currentTime >= 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration,
            playbackRate: 1,
            position: Math.min(currentTime, duration),
          });
        } catch {
          /* setPositionState not supported or invalid range */
        }
      }
    } catch (e) {
      console.debug("[PlaybackController] MediaSession update failed:", e);
    }
  }, [currentTrack, isPlaying, currentTime, duration]);

  // 9. Register Media Session Control Action Handlers
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const actionHandlers: Array<[MediaSessionAction, MediaSessionActionHandler | null]> = [
      ["play", () => play()],
      ["pause", () => pause()],
      ["previoustrack", () => handlePrevTrack()],
      ["nexttrack", () => handleNextTrack()],
      ["seekto", (details) => {
        if (details.seekTime !== undefined && duration > 0) {
          seekToRatio(details.seekTime / duration);
        }
      }],
      ["seekbackward", () => {
        if (duration > 0) {
          seekToRatio(Math.max(0, (currentTime - 10) / duration));
        }
      }],
      ["seekforward", () => {
        if (duration > 0) {
          seekToRatio(Math.min(1, (currentTime + 10) / duration));
        }
      }],
      ["stop", () => pause()],
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* Action not supported by browser */
      }
    });

    return () => {
      actionHandlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          /* ignore */
        }
      });
    };
  }, [play, pause, handlePrevTrack, handleNextTrack, seekToRatio, duration, currentTime]);

  return {
    currentIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    progress: duration > 0 ? currentTime / duration : 0,
    playerStatus,
    trackWarning,
    audioRef,
    playerDivId,
    play,
    pause,
    toggle,
    seekToRatio,
    nextTrack: handleNextTrack,
    prevTrack: handlePrevTrack,
    selectTrack,
    logDiagnostics,
  };
}
