"use client";

import { useState, useRef, useEffect } from "react";
import {
  startVoiceRecording,
  stopVoiceRecording,
  uploadVoiceMessage,
  getAudioDuration,
  formatDuration,
  VOICE_CONFIG,
} from "@/app/lib/voice-messages";

interface VoiceRecorderProps {
  tapeId: string;
  onRecordingComplete?: (url: string, duration: number, trackId?: string) => void;
}

export function VoiceRecorder({ tapeId, onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    console.log("[VoiceRecorder] Starting recording...");
    const recorder = await startVoiceRecording();
    if (!recorder) {
      console.error("[VoiceRecorder] Failed to initialize MediaRecorder");
      alert("Unable to access microphone. Please check permissions.");
      return;
    }

    console.log("[VoiceRecorder] MediaRecorder initialized, state:", recorder.state);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setDuration(0);

    // Start recording
    recorder.start();
    console.log("[VoiceRecorder] Recording started");

    timerRef.current = setInterval(() => {
      setDuration((d) => {
        if (d >= VOICE_CONFIG.maxDuration) {
          console.log("[VoiceRecorder] Max duration reached, stopping...");
          stopRecording();
          return VOICE_CONFIG.maxDuration;
        }
        return d + 1;
      });
    }, 1000);
  };

  const stopRecording = async () => {
    console.log("[VoiceRecorder] Stopping recording...");
    if (!mediaRecorderRef.current) {
      console.error("[VoiceRecorder] No MediaRecorder reference");
      return;
    }

    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const blob = await stopVoiceRecording(mediaRecorderRef.current);
    console.log("[VoiceRecorder] Blob captured:", {
      size: blob.size,
      type: blob.type,
    });

    if (blob.size === 0) {
      console.error("[VoiceRecorder] Empty blob - no audio was recorded");
      alert("No audio was recorded. Please try again.");
      return;
    }

    if (blob.size > VOICE_CONFIG.maxFileSize) {
      console.error("[VoiceRecorder] File too large:", blob.size);
      alert("Recording too large. Maximum 10MB.");
      return;
    }

    setIsUploading(true);
    console.log("[VoiceRecorder] Uploading blob to API...");

    const result = await uploadVoiceMessage(blob, tapeId);
    console.log("[VoiceRecorder] Upload result:", result);

    if (result) {
      console.log("[VoiceRecorder] Recording complete, calling callback");
      setRecordingUrl(result.url);
      onRecordingComplete?.(result.url, result.duration, result.trackId);
    } else {
      console.error("[VoiceRecorder] Upload failed");
      alert("Failed to upload recording. Please try again.");
    }

    setIsUploading(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
      <h3 className="font-semibold mb-3">🎤 Add a Voice Message</h3>

      {recordingUrl ? (
        // Playback mode
        <div className="space-y-3">
          <p className="text-sm text-green-700">✓ Voice message recorded</p>
          <audio src={recordingUrl} controls className="w-full" />
          <button
            onClick={() => setRecordingUrl(null)}
            className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
          >
            Re-record
          </button>
        </div>
      ) : isRecording ? (
        // Recording mode
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-mono text-lg">{formatDuration(duration)}</span>
            <span className="text-xs text-gray-600">
              (Max {formatDuration(VOICE_CONFIG.maxDuration)})
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={stopRecording}
              disabled={isUploading}
              className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 text-sm"
            >
              {isUploading ? "Uploading..." : "✓ Done"}
            </button>
            <button
              onClick={cancelRecording}
              className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      ) : (
        // Idle mode
        <button
          onClick={startRecording}
          className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium flex items-center justify-center gap-2"
        >
          <span>🎙️</span>
          Start Recording
        </button>
      )}

      <p className="text-xs text-gray-600 mt-3">
        Max 5 minutes, {(VOICE_CONFIG.maxFileSize / 1024 / 1024).toFixed(0)}MB file size
      </p>
    </div>
  );
}

/**
 * Voice message player (for tape view)
 */
export function VoiceMessagePlayer({ url, duration }: { url: string; duration?: number }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <p className="text-sm font-medium mb-3">🎤 Voice Message from Sender</p>
      <audio
        src={url}
        controls
        className="w-full mb-2"
        style={{ outline: "none" }}
      />
      {duration && (
        <p className="text-xs text-gray-600">{formatDuration(duration)} message</p>
      )}
    </div>
  );
}
