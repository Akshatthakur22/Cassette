"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { YoutubePlaylist, YoutubePlaylistItem } from "@/app/lib/youtube";

interface PlaylistItemSelectorProps {
  playlist: YoutubePlaylist;
  onConfirm: (items: YoutubePlaylistItem[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PlaylistItemSelector({
  playlist,
  onConfirm,
  onCancel,
  isLoading = false,
}: PlaylistItemSelectorProps) {
  const [items, setItems] = useState<YoutubePlaylistItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch playlist items on mount
  React.useEffect(() => {
    (async () => {
      try {
        const response = await fetch(
          `/api/youtube/playlists/items?playlistId=${encodeURIComponent(playlist.id)}`
        );
        if (!response.ok) {
          throw new Error("Failed to load playlist items");
        }
        const data = await response.json();
        setItems(data.items || []);
        // Pre-select all items
        setSelectedItems(new Set(data.items?.map((i: YoutubePlaylistItem) => i.videoId) || []));
      } catch (err) {
        setError("Failed to load playlist items. Please try again.");
      } finally {
        setItemsLoading(false);
      }
    })();
  }, [playlist.id]);

  function toggleItem(videoId: string) {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedItems(newSelected);
  }

  function handleConfirm() {
    const selected = items.filter((item) => selectedItems.has(item.videoId));
    startTransition(async () => {
      await onConfirm(selected);
    });
  }

  const itemsToDisplay = items.slice(0, 24);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
        style={{ background: "#FBFAF7" }}
      >
        {/* Header */}
        <div
          className="px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10"
          style={{ background: "#FFFFFF", borderBottom: "1px solid #E8E5DF" }}
        >
          <div className="flex-1 min-w-0">
            <h2
              className="text-lg font-semibold truncate"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                color: "#1D1D1F",
              }}
            >
              {playlist.title}
            </h2>
            <p className="text-xs mt-1" style={{ color: "#8E8E93" }}>
              {selectedItems.size} of {itemsToDisplay.length} selected
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-2xl leading-none hover:opacity-60 transition-opacity ml-2 flex-shrink-0"
            style={{ color: "#8E8E93" }}
            aria-label="Close"
            disabled={isPending || itemsLoading}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 max-h-96 overflow-y-auto">
          {itemsLoading ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: "#8E8E93" }}>
                Loading songs…
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg" style={{ background: "rgba(196,80,58,0.08)" }}>
              <p className="text-xs" style={{ color: "#C4503A" }}>
                {error}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {itemsToDisplay.map((item) => (
                  <motion.label
                    key={item.videoId}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-opacity-80"
                    style={{
                      background: selectedItems.has(item.videoId)
                        ? "rgba(212, 136, 42, 0.1)"
                        : "#F3EFE7",
                      border: `1px solid ${
                        selectedItems.has(item.videoId) ? "#D4882A" : "#E8E5DF"
                      }`,
                      minHeight: "44px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.videoId)}
                      onChange={() => toggleItem(item.videoId)}
                      className="w-5 h-5 rounded flex-shrink-0"
                      style={{ cursor: "pointer", minWidth: "44px" }}
                      disabled={isPending || itemsLoading}
                      aria-label={`Select ${item.title}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1D1D1F" }}>
                        {item.title}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#8E8E93" }}>
                        {item.channelTitle}
                      </p>
                    </div>
                  </motion.label>
                ))}
              </div>
            </AnimatePresence>
          )}

          {itemsToDisplay.length === 0 && !itemsLoading && !error && (
            <p className="text-sm text-center" style={{ color: "#8E8E93" }}>
              No songs found
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 sm:px-6 py-4 flex gap-3 sticky bottom-0"
          style={{ background: "#FFFBF0", borderTop: "1px solid #E8E5DF" }}
        >
          <button
            onClick={onCancel}
            disabled={isPending || itemsLoading}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all btn-ghost disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending || itemsLoading || selectedItems.size === 0}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all btn-primary disabled:opacity-50"
          >
            {isPending ? "Adding…" : `Add ${selectedItems.size} Songs`}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
