/**
 * Voice Recording Module
 * Handles microphone access, audio capture, and processing
 * Uses Web Audio API for high-quality recording
 */

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  volume: number;
  error: string | null;
}

export interface AudioBuffer {
  data: Float32Array[];
  sampleRate: number;
  duration: number;
  format: "wav" | "mp3" | "opus";
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private pauseTime: number = 0;
  private totalPausedTime: number = 0;
  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    volume: 0,
    error: null,
  };

  private stateListener: ((state: RecordingState) => void) | null = null;
  private volumeListener: ((volume: number) => void) | null = null;

  /**
   * Request microphone access and initialize recorder
   */
  async initialize(): Promise<boolean> {
    try {
      // Request mic permission
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create analyser for volume visualization
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      // Connect stream to analyser
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      // Create media recorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128 kbps
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.state.error = null;
      this.notifyStateChange();
      return true;
    } catch (error: any) {
      this.state.error = this.getUserMediaErrorMessage(error);
      this.notifyStateChange();
      return false;
    }
  }

  /**
   * Start recording
   */
  start(): boolean {
    if (!this.mediaRecorder) {
      this.state.error = "Recorder not initialized. Call initialize() first.";
      this.notifyStateChange();
      return false;
    }

    try {
      this.chunks = [];
      this.startTime = Date.now();
      this.totalPausedTime = 0;
      this.mediaRecorder.start();

      this.state.isRecording = true;
      this.state.isPaused = false;
      this.state.duration = 0;
      this.state.error = null;

      // Start volume monitoring
      this.startVolumeMonitoring();
      this.notifyStateChange();

      return true;
    } catch (error: any) {
      this.state.error = `Failed to start recording: ${error.message}`;
      this.notifyStateChange();
      return false;
    }
  }

  /**
   * Pause recording
   */
  pause(): boolean {
    if (!this.mediaRecorder || !this.state.isRecording) {
      return false;
    }

    try {
      this.mediaRecorder.pause();
      this.pauseTime = Date.now();
      this.state.isPaused = true;
      this.notifyStateChange();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Resume recording
   */
  resume(): boolean {
    if (!this.mediaRecorder || !this.state.isPaused) {
      return false;
    }

    try {
      this.mediaRecorder.resume();
      this.totalPausedTime += Date.now() - this.pauseTime;
      this.state.isPaused = false;
      this.notifyStateChange();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Stop recording and return blob
   */
  async stop(): Promise<Blob | null> {
    if (!this.mediaRecorder) {
      return null;
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.mediaRecorder?.mimeType || "audio/webm",
        });

        this.state.isRecording = false;
        this.state.isPaused = false;
        this.notifyStateChange();

        resolve(blob);
      };

      this.mediaRecorder.stop();
      this.stopVolumeMonitoring();
    });
  }

  /**
   * Cancel recording (discard audio)
   */
  cancel(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.chunks = [];
      this.state.isRecording = false;
      this.state.isPaused = false;
      this.notifyStateChange();
    }
  }

  /**
   * Release resources
   */
  dispose(): void {
    this.stopVolumeMonitoring();

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.analyser = null;
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    if (this.state.isRecording) {
      const elapsed = Date.now() - this.startTime - this.totalPausedTime;
      this.state.duration = Math.floor(elapsed / 1000);
    }
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: RecordingState) => void): () => void {
    this.stateListener = listener;
    return () => {
      this.stateListener = null;
    };
  }

  /**
   * Subscribe to volume updates (for visualization)
   */
  onVolumeChange(listener: (volume: number) => void): () => void {
    this.volumeListener = listener;
    return () => {
      this.volumeListener = null;
    };
  }

  // ── Private methods ──────────────────────────────────────────────

  private startVolumeMonitoring(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const monitor = () => {
      if (!this.state.isRecording) return;

      this.analyser!.getByteFrequencyData(dataArray);

      // Calculate average volume (0-1 scale)
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length / 255;
      this.state.volume = average;

      if (this.volumeListener) {
        this.volumeListener(average);
      }

      requestAnimationFrame(monitor);
    };

    requestAnimationFrame(monitor);
  }

  private stopVolumeMonitoring(): void {
    this.state.volume = 0;
  }

  private getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/wav",
      "audio/ogg",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return ""; // Browser will use default
  }

  private getUserMediaErrorMessage(error: any): string {
    if (error.name === "NotAllowedError") {
      return "Microphone permission denied. Please allow access to continue.";
    }
    if (error.name === "NotFoundError") {
      return "No microphone found. Please check your device.";
    }
    if (error.name === "NotReadableError") {
      return "Microphone is in use. Please close other apps using the mic.";
    }
    return `Microphone error: ${error.message}`;
  }

  private notifyStateChange(): void {
    if (this.stateListener) {
      this.stateListener(this.getState());
    }
  }
}

/**
 * Convert audio blob to data URL for playback
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert audio blob to base64 for upload
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return blobToDataUrl(blob).then((dataUrl) =>
    dataUrl.split(",")[1]
  );
}

/**
 * Upload audio file to server
 */
export async function uploadVoiceRecording(
  blob: Blob,
  tapeId: string
): Promise<{ success: boolean; error?: string; trackId?: string }> {
  try {
    const formData = new FormData();
    formData.append("audio", blob, "voice-recording.webm");
    formData.append("tapeId", tapeId);

    const response = await fetch("/api/upload-voice-recording", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error };
    }

    const data = await response.json();
    return { success: true, trackId: data.trackId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
