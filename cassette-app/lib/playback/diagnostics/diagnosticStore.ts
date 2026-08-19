import { nativePlaybackBridge } from "../native/NativePlaybackBridge";
import { NativeDiagnosticsData } from "../native/CassettePlaybackPlugin";
import { playbackController } from "../PlaybackController";

const reactLogs: string[] = [];

export function recordReactDiagnosticLog(tag: string, message: string) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now
    .getMilliseconds()
    .toString()
    .padStart(3, "0")}`;
  const entry = `[${time}][${tag}] ${message}`;
  reactLogs.push(entry);
  if (reactLogs.length > 200) {
    reactLogs.shift();
  }
}

// Monkey-patch console.log for [REACT-PLAYBACK]
if (typeof window !== "undefined") {
  const origLog = console.log;
  console.log = (...args: unknown[]) => {
    origLog.apply(console, args);
    const first = args[0];
    if (typeof first === "string" && first.includes("[REACT-PLAYBACK]")) {
      recordReactDiagnosticLog("REACT-PLAYBACK", args.slice(1).map(String).join(" "));
    }
  };
}

export interface CompleteDiagnosticsReport {
  timestamp: string;
  native: NativeDiagnosticsData;
  reactState: ReturnType<typeof playbackController.getState>;
  reactLogs: string[];
  combinedFormattedText: string;
}

export async function getCompleteDiagnostics(): Promise<CompleteDiagnosticsReport> {
  const nativeData = await nativePlaybackBridge.getDiagnostics();
  const reactState = playbackController.getState();
  const timestamp = new Date().toISOString();

  const formattedText = `==================================================
CASSETTE PLAYBACK DIAGNOSTICS REPORT
Timestamp: ${timestamp}
==================================================

1. ANDROID NATIVE SERVICE & PLAYER:
- Service Alive: ${nativeData.serviceAlive ? "YES (Alive)" : "NO (Dead)"}
- Service ID: ${nativeData.serviceId}
- ExoPlayer Alive: ${nativeData.playerAlive ? "YES (Alive)" : "NO (Dead)"}
- ExoPlayer ID: ${nativeData.playerId}
- ExoPlayer State: ${nativeData.playerState}
- isPlaying (Native): ${nativeData.isPlaying}
- playWhenReady: ${nativeData.playWhenReady}
- Current Position (Native): ${nativeData.currentPosition.toFixed(2)}s (${Math.floor(nativeData.currentPosition / 60)}:${Math.floor(nativeData.currentPosition % 60).toString().padStart(2, "0")})
- Duration (Native): ${nativeData.duration.toFixed(2)}s (${Math.floor(nativeData.duration / 60)}:${Math.floor(nativeData.duration % 60).toString().padStart(2, "0")})
- Current Track ID (Native): ${nativeData.currentTrackId || "None"}
- MediaController Connected: ${nativeData.controllerConnected ? "YES" : "NO"}
- Last Activity State: ${nativeData.lastActivityState}

2. REACT PLAYBACK STATE:
- isPlaying (React): ${reactState.isPlaying}
- Current Position (React): ${reactState.currentTime.toFixed(2)}s
- Duration (React): ${reactState.duration.toFixed(2)}s
- Current Track ID (React): ${reactState.currentTrack?.id || "None"}
- Current Provider (React): ${reactState.currentTrack?.provider || "None"}
- Queue Length: ${reactState.queue.length}, Index: ${reactState.queueIndex}

3. RECENT ACTIVITY LIFECYCLE EVENTS:
${nativeData.activityEvents && nativeData.activityEvents.length > 0 ? nativeData.activityEvents.join("\n") : "(None)"}

4. NATIVE LOG BUFFER (Last ${nativeData.logs?.length || 0} events):
${nativeData.logs && nativeData.logs.length > 0 ? nativeData.logs.join("\n") : "(None)"}

5. REACT PLAYBACK LOG BUFFER (Last ${reactLogs.length} events):
${reactLogs.length > 0 ? reactLogs.join("\n") : "(None)"}
==================================================`;

  return {
    timestamp,
    native: nativeData,
    reactState,
    reactLogs: [...reactLogs],
    combinedFormattedText: formattedText,
  };
}
