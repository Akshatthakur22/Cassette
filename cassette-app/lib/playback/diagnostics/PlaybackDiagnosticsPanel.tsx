"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getCompleteDiagnostics,
  CompleteDiagnosticsReport,
} from "./diagnosticStore";

export function PlaybackDiagnosticsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [report, setReport] = useState<CompleteDiagnosticsReport | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDiagnostics = useCallback(async () => {
    try {
      const data = await getCompleteDiagnostics();
      setReport(data);
    } catch (e) {
      console.debug("[DiagnosticsPanel] Error fetching diagnostics:", e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const data = await getCompleteDiagnostics();
        if (mounted) setReport(data);
      } catch (e) {
        console.debug("[DiagnosticsPanel] Error fetching diagnostics:", e);
      }
    };
    run();
    if (!autoRefresh) {
      return () => {
        mounted = false;
      };
    }
    const interval = setInterval(run, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleCopy = async () => {
    if (!report) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(report.combinedFormattedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error("Failed to copy diagnostics:", err);
    }
  };

  const native = report?.native;
  const reactState = report?.reactState;

  return (
    <>
      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-xl border border-neutral-700 bg-neutral-900/95 text-neutral-100 shadow-2xl overflow-hidden font-mono text-xs">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/80">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm">
                  🛠️ Playback Diagnostics
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                  DEV ONLY
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-amber-500 hover:bg-amber-400 text-black active:scale-95"
                  }`}
                >
                  {copied ? "✅ Copied Report!" : "📋 Copy Diagnostics"}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0"
                />
                Auto-refresh (1s)
              </label>
              <button
                onClick={fetchDiagnostics}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              >
                🔄 Refresh Now
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Service Alive */}
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400">Service</div>
                  <div
                    className={`font-bold ${
                      native?.serviceAlive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {native?.serviceAlive ? "🟢 Alive" : "🔴 Dead"}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    ID: {native?.serviceId || 0}
                  </div>
                </div>

                {/* ExoPlayer Alive */}
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400">ExoPlayer</div>
                  <div
                    className={`font-bold ${
                      native?.playerAlive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {native?.playerAlive ? "🟢 Alive" : "🔴 Dead"}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    ID: {native?.playerId || 0}
                  </div>
                </div>

                {/* Player State */}
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400">Player State</div>
                  <div className="font-bold text-amber-300 truncate">
                    {native?.playerState || "UNKNOWN"}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    ready: {String(native?.playWhenReady)}
                  </div>
                </div>

                {/* Playing State */}
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400">isPlaying</div>
                  <div
                    className={`font-bold ${
                      native?.isPlaying ? "text-green-400" : "text-neutral-400"
                    }`}
                  >
                    {native?.isPlaying ? "▶️ Playing" : "⏸️ Paused"}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    React: {reactState?.isPlaying ? "true" : "false"}
                  </div>
                </div>

                {/* Native Position */}
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400">Native Pos</div>
                  <div className="font-bold text-cyan-300">
                    {native?.currentPosition
                      ? `${native.currentPosition.toFixed(1)}s`
                      : "0.0s"}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    dur: {native?.duration?.toFixed(1) || 0}s
                  </div>
                </div>

                {/* React Position */}
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400">React Pos</div>
                  <div className="font-bold text-cyan-300">
                    {reactState?.currentTime?.toFixed(1) || 0}s
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    dur: {reactState?.duration?.toFixed(1) || 0}s
                  </div>
                </div>

                {/* Activity State */}
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400">Activity</div>
                  <div className="font-bold text-purple-300 truncate">
                    {native?.lastActivityState || "NONE"}
                  </div>
                  <div className="text-[10px] text-neutral-500">Lifecycle</div>
                </div>

                {/* MediaController */}
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400">Controller</div>
                  <div
                    className={`font-bold ${
                      native?.controllerConnected
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {native?.controllerConnected ? "Connected" : "Disconnected"}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate">
                    track: {native?.currentTrackId || "none"}
                  </div>
                </div>
              </div>

              {/* Activity Lifecycle History */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-neutral-300">
                  Activity Lifecycle Events:
                </div>
                <div className="p-2 rounded bg-black/60 border border-neutral-800 max-h-24 overflow-y-auto text-[10px] text-purple-300 space-y-0.5">
                  {native?.activityEvents && native.activityEvents.length > 0 ? (
                    native.activityEvents.map((act, i) => (
                      <div key={i}>{act}</div>
                    ))
                  ) : (
                    <div className="text-neutral-500">No activity events recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Native Logs Terminal */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-300">
                  <span>Native Buffer Logs ({native?.logs?.length || 0}):</span>
                </div>
                <div className="p-2 rounded bg-black/80 border border-neutral-800 max-h-48 overflow-y-auto text-[10px] text-neutral-300 space-y-0.5 whitespace-pre-wrap select-text">
                  {native?.logs && native.logs.length > 0 ? (
                    native.logs.map((log, i) => (
                      <div
                        key={i}
                        className={
                          log.includes("ERROR") || log.includes("onDestroy")
                            ? "text-red-400"
                            : log.includes("SERVICE")
                            ? "text-green-300"
                            : log.includes("PLUGIN")
                            ? "text-amber-300"
                            : "text-neutral-300"
                        }
                      >
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-neutral-500">No native logs in buffer.</div>
                  )}
                </div>
              </div>

              {/* React Playback Logs Terminal */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-neutral-300">
                  React Playback Logs ({report?.reactLogs?.length || 0}):
                </div>
                <div className="p-2 rounded bg-black/80 border border-neutral-800 max-h-36 overflow-y-auto text-[10px] text-cyan-300 space-y-0.5 whitespace-pre-wrap select-text">
                  {report?.reactLogs && report.reactLogs.length > 0 ? (
                    report.reactLogs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))
                  ) : (
                    <div className="text-neutral-500">No React logs in buffer.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-800 bg-neutral-950/80">
              <span className="text-[10px] text-neutral-500">
                Tap &ldquo;Copy Diagnostics&rdquo; to copy full diagnostic report.
              </span>
              <button
                onClick={handleCopy}
                className={`px-4 py-1.5 rounded font-semibold text-xs transition-all ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-amber-500 hover:bg-amber-400 text-black active:scale-95"
                }`}
              >
                {copied ? "✅ Copied to Clipboard!" : "📋 Copy Diagnostics"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
