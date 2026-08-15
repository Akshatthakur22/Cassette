"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { YoutubeSearchBar } from "./YoutubeSearchBar";
import type { YoutubePlaylist, YoutubePlaylistItem } from "@/app/lib/youtube";

interface PlaylistSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlaylist: (playlist: YoutubePlaylist) => void;
}

export function PlaylistSearchModal({
  isOpen,
  onClose,
  onSelectPlaylist,
}: PlaylistSearchModalProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<YoutubePlaylist | null>(null);

  async function handleSelectResult(result: any) {
    // Result is from YoutubeSearchBar which returns playlist results
    // We need to fetch full playlist details
    if (result.videoId) {
      const playlist: YoutubePlaylist = {
        id: result.videoId,
        title: result.title,
        channelTitle: result.channelTitle,
        thumbnail: result.thumbnail,
        itemCount: result.durationSec || 0, // For playlists, durationSec = itemCount
      };
      setSelectedPlaylist(playlist);
      onSelectPlaylist(playlist);
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
              style={{ background: "#FBFAF7" }}
            >
              {/* Header */}
              <div
                className="px-4 sm:px-6 py-4 flex items-center justify-between"
                style={{ background: "#FFFFFF", borderBottom: "1px solid #E8E5DF" }}
              >
                <h2
                  className="text-lg font-semibold"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    color: "#1D1D1F",
                  }}
                >
                  🎵 Add from Playlist
                </h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:opacity-60 transition-opacity"
                  style={{
                    color: "#8E8E93",
                    minWidth: "44px",
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                  aria-label="Close playlist selector"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="px-4 sm:px-6 py-5 sm:py-6">
                <YoutubeSearchBar
                  onSelectResult={handleSelectResult}
                  placeholder="Search playlists by name..."
                  type="playlist"
                />
                <p className="text-xs mt-4" style={{ color: "#A09A8A" }}>
                  Search for any public YouTube playlist. We'll load all the songs for you to pick from.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
