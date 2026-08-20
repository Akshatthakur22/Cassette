import { PlaybackEngine, PlaybackTrack, PlaybackState } from "./types";
import { AudioEngine } from "./AudioEngine";

/**
 * YouTubeEngine is an alias delegating directly to HTML5 AudioEngine
 * for audio library playback. YouTube iframe scripts and video players are removed.
 */
export class YouTubeEngine implements PlaybackEngine {
  private audioEngine: AudioEngine;

  constructor(_containerId?: string) {
    this.audioEngine = new AudioEngine();
  }

  onStateChange(cb: (partial: Partial<PlaybackState>) => void): void {
    this.audioEngine.onStateChange(cb);
  }

  async load(track: PlaybackTrack): Promise<void> {
    return this.audioEngine.load(track);
  }

  async play(): Promise<void> {
    return this.audioEngine.play();
  }

  async pause(): Promise<void> {
    return this.audioEngine.pause();
  }

  async seek(seconds: number): Promise<void> {
    return this.audioEngine.seek(seconds);
  }

  destroy(): void {
    this.audioEngine.destroy();
  }
}
