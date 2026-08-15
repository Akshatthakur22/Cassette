/**
 * Voice message recording, upload, and playback
 * Supports webm, mp3, wav formats
 */

export interface VoiceMessageConfig {
  maxDuration: number; // seconds
  maxFileSize: number; // bytes
  mimeType: string;
}

export const VOICE_CONFIG: VoiceMessageConfig = {
  maxDuration: 300, // 5 minutes
  maxFileSize: 5 * 1024 * 1024, // 5MB
  mimeType: "audio/webm;codecs=opus",
};

/**
 * Start recording voice message
 */
export async function startVoiceRecording(): Promise<MediaRecorder | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: VOICE_CONFIG.mimeType,
    });
    return mediaRecorder;
  } catch (error) {
    console.error("Failed to start recording:", error);
    return null;
  }
}

/**
 * Stop recording and return blob
 */
export function stopVoiceRecording(mediaRecorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve) => {
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event) => {
      console.log("[stopVoiceRecording] Data available:", {
        dataSize: event.data.size,
        dataType: event.data.type,
      });
      chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      console.log("[stopVoiceRecording] Recorder stopped, combining chunks:", {
        chunkCount: chunks.length,
        totalData: chunks.reduce((sum, c) => sum + (c as Blob).size, 0),
      });
      const blob = new Blob(chunks, { type: VOICE_CONFIG.mimeType });
      console.log("[stopVoiceRecording] Final blob created:", {
        size: blob.size,
        type: blob.type,
      });
      resolve(blob);
    };

    mediaRecorder.onerror = (event) => {
      console.error("[stopVoiceRecording] MediaRecorder error:", event);
    };

    console.log("[stopVoiceRecording] Stopping MediaRecorder, current state:", mediaRecorder.state);
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((track) => {
      console.log("[stopVoiceRecording] Stopping track:", track.kind);
      track.stop();
    });
  });
}

/**
 * Upload voice message to storage
 * Returns presigned URL
 */
export async function uploadVoiceMessage(
  blob: Blob,
  tapeId: string
): Promise<{ url: string; size: number; duration: number; trackId: string } | null> {
  try {
    console.log("[uploadVoiceMessage] Starting upload:", {
      blobSize: blob.size,
      blobType: blob.type,
      tapeId,
    });

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("tapeId", tapeId);

    const response = await fetch("/api/voice-messages/upload", {
      method: "POST",
      body: formData,
    });

    console.log("[uploadVoiceMessage] API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[uploadVoiceMessage] Upload failed:", {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    console.log("[uploadVoiceMessage] Upload successful:", result);
    return result;
  } catch (error) {
    console.error("[uploadVoiceMessage] Error:", error);
    return null;
  }
}

/**
 * Get audio duration from blob
 */
export async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);

    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration));
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve(0);
    });

    audio.src = url;
  });
}

/**
 * Format audio duration (MM:SS)
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Delete voice message
 */
export async function deleteVoiceMessage(tapeId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/voice-messages/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tapeId }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to delete voice message:", error);
    return false;
  }
}
