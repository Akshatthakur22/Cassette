"use client";

import { useState, useRef, useEffect } from "react";
import { getTapeActionAriaLabel, getPlayerControlAriaLabel, keyboardHelpers } from "@/app/lib/accessibility";

interface AccessiblePlayerProps {
  trackTitle: string;
  trackNumber: number;
  totalTracks: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
  currentTime: number;
  duration: number;
  volume: number;
}

/**
 * Accessible audio player with full keyboard support
 * - Space: Play/pause
 * - Arrow keys: Volume & progress navigation
 * - M: Mute/unmute
 */
export function AccessiblePlayer({
  trackTitle,
  trackNumber,
  totalTracks,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
  currentTime,
  duration,
  volume,
}: AccessiblePlayerProps) {
  const [isFocused, setIsFocused] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused) return;

      if (keyboardHelpers.isSpace(e)) {
        e.preventDefault();
        onPlayPause();
      } else if (keyboardHelpers.isArrowRight(e)) {
        e.preventDefault();
        onNext();
      } else if (keyboardHelpers.isArrowLeft(e)) {
        e.preventDefault();
        onPrevious();
      } else if (keyboardHelpers.isArrowUp(e)) {
        e.preventDefault();
        onVolumeChange(Math.min(volume + 10, 100));
      } else if (keyboardHelpers.isArrowDown(e)) {
        e.preventDefault();
        onVolumeChange(Math.max(volume - 10, 0));
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        onVolumeChange(volume === 0 ? 50 : 0);
      }
    };

    const player = playerRef.current;
    if (player) {
      player.addEventListener("keydown", handleKeyDown);
      return () => player.removeEventListener("keydown", handleKeyDown);
    }
  }, [isFocused, isPlaying, volume, onPlayPause, onNext, onPrevious, onVolumeChange]);

  const formattedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={playerRef}
      role="region"
      aria-label="Music player controls"
      className="w-full bg-amber-50 rounded-lg p-4 shadow-sm"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
    >
      {/* Track info */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          <span aria-label={`Now playing: ${trackTitle}`}>{trackTitle}</span>
        </h2>
        <p className="text-sm text-gray-600">
          Track <span aria-live="polite">{trackNumber}</span> of {totalTracks}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-4 space-y-2">
        <input
          ref={progressRef}
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            // Note: you'd need to implement seeking in actual player
          }}
          aria-label={getPlayerControlAriaLabel("progress", `${formattedTime(currentTime)} of ${formattedTime(duration)}`)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-600">
          <span aria-label="Current time">{formattedTime(currentTime)}</span>
          <span aria-label="Total duration">{formattedTime(duration)}</span>
        </div>
      </div>

      {/* Player controls */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          onClick={onPrevious}
          aria-label={getTapeActionAriaLabel("previous")}
          title="Previous (← arrow)"
          className="p-2 rounded hover:bg-amber-100 transition"
        >
          ⏮️
        </button>

        <button
          onClick={onPlayPause}
          aria-label={getTapeActionAriaLabel(isPlaying ? "pause" : "play")}
          aria-pressed={isPlaying}
          title={`${isPlaying ? "Pause" : "Play"} (Space)`}
          className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-semibold"
        >
          {isPlaying ? "⏸️ Pause" : "▶️ Play"}
        </button>

        <button
          onClick={onNext}
          aria-label={getTapeActionAriaLabel("next")}
          title="Next (→ arrow)"
          className="p-2 rounded hover:bg-amber-100 transition"
        >
          ⏭️
        </button>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-3">
        <label htmlFor="volume-control" className="text-sm font-medium text-gray-700">
          Volume
        </label>
        <input
          id="volume-control"
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(parseInt(e.target.value))}
          aria-label={getPlayerControlAriaLabel("volume", volume)}
          title="Volume (↑/↓ arrows, M to mute)"
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm text-gray-600" aria-live="polite">
          {volume}%
        </span>
      </div>

      {/* Keyboard shortcuts hint */}
      <details className="mt-4 text-sm text-gray-600">
        <summary className="cursor-pointer font-medium text-gray-700">
          Keyboard shortcuts
        </summary>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li><kbd>Space</kbd> — Play/pause</li>
          <li><kbd>←</kbd> — Previous track</li>
          <li><kbd>→</kbd> — Next track</li>
          <li><kbd>↑</kbd> — Increase volume</li>
          <li><kbd>↓</kbd> — Decrease volume</li>
          <li><kbd>M</kbd> — Mute/unmute</li>
        </ul>
      </details>
    </div>
  );
}
