"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface YoutubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail?: string;
  durationSec?: number;
}

interface YoutubeSearchBarProps {
  onSelectResult: (result: YoutubeSearchResult) => void;
  placeholder?: string;
  type?: "song" | "playlist";
}

export function YoutubeSearchBar({
  onSelectResult,
  placeholder = "Search songs or artists...",
  type = "song",
}: YoutubeSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YoutubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search with real-time feedback
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    setIsSearching(true);
    // Increased debounce time for better UX (users see "searching..." state)
    searchTimeoutRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const endpoint =
            type === "song"
              ? `/api/search-enhanced?title=${encodeURIComponent(query.trim())}&cache=true`
              : `/api/youtube/playlists/search?q=${encodeURIComponent(query.trim())}`;

          const response = await fetch(endpoint);
          if (!response.ok) {
            console.error(`Search request failed with status ${response.status}`);
            throw new Error(`Search failed: ${response.status}`);
          }

          const data = await response.json();

          // Check for API errors in response body
          if (data.error) {
            console.warn("Search API returned error:", data.error, data.message);
          }

          if (type === "song") {
            const songResults = (data.results || []).slice(0, 10).map((r: any) => ({
              videoId: r.videoId,
              title: r.title,
              channelTitle: r.channelTitle,
              thumbnail: r.thumbnailUrl,
              durationSec: r.durationSec,
              cached: r.cached,
            }));
            setResults(songResults);
          } else {
            const playlistResults = (data.playlists || []).slice(0, 8).map((p: any) => ({
              videoId: p.id,
              title: p.title,
              channelTitle: p.channelTitle || "YouTube",
              thumbnail: p.thumbnail,
              durationSec: p.itemCount,
            }));
            setResults(playlistResults);
          }

          setSelectedIndex(0);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error("Search error:", errorMsg, { query, type });
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      });
    }, 400); // Increased debounce for smoother feel (was 300ms)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, type]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!results.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setQuery("");
        setResults([]);
        inputRef.current?.blur();
        break;
    }
  }

  function handleSelectResult(result: YoutubeSearchResult) {
    onSelectResult(result);
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div
        className="relative flex items-center rounded-xl overflow-hidden transition-all duration-200"
        style={{
          background: "#FFFFFF",
          border: isFocused ? "1.5px solid #D4882A" : "1px solid #E8E5DF",
          boxShadow: isFocused ? "0 4px 16px rgba(212, 136, 42, 0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <span className="pl-3.5 text-lg flex-shrink-0" style={{ color: "#D4882A" }}>
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-3 sm:py-3.5 text-sm sm:text-base outline-none bg-transparent"
          style={{ color: "#1D1D1F", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
          spellCheck="false"
        />

        {/* Clear button */}
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleClear}
              className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity flex-shrink-0 rounded-lg"
              style={{
                color: "#8E8E93",
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Clear search"
              title="Clear search"
            >
              ✕
            </motion.button>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        <AnimatePresence>
          {isSearching && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pr-3.5 text-xs"
              style={{ color: "#D4882A" }}
            >
              ⟳
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isFocused && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-lg"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E5DF",
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              maxHeight: "320px",
              overflowY: "auto",
            }}
          >
            {results.map((result, idx) => (
              <motion.button
                key={result.videoId}
                onClick={() => handleSelectResult(result)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className="w-full text-left px-3 sm:px-4 py-3 border-b last:border-b-0 transition-colors flex gap-3 hover:no-underline"
                style={{
                  background: selectedIndex === idx ? "#F3EFE7" : "#FFFFFF",
                  borderColor: "#F0EDE7",
                }}
              >
                {/* Thumbnail */}
                {result.thumbnail && (
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-12 h-9 rounded object-cover flex-shrink-0"
                    loading="lazy"
                  />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "#1D1D1F" }}
                  >
                    {result.title}
                  </p>
                  <p
                    className="text-xs truncate mt-0.5"
                    style={{ color: "#8E8E93" }}
                  >
                    {result.channelTitle}
                    {result.durationSec && type === "song"
                      ? ` · ${formatDuration(result.durationSec)}`
                      : type === "playlist"
                      ? ` · ${result.durationSec} songs`
                      : ""}
                  </p>
                </div>

                {/* Keyboard hint for first item */}
                {idx === selectedIndex && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs flex-shrink-0"
                    style={{ color: "#D4882A" }}
                  >
                    ↵
                  </motion.span>
                )}
              </motion.button>
            ))}

            {/* Empty state with tip */}
            {results.length === 0 && query && !isSearching && (
              <div className="p-4 text-center" style={{ color: "#8E8E93" }}>
                <p className="text-sm">No results found</p>
                <p className="text-xs mt-1">Try a different search</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text */}
      {isFocused && query.length === 0 && results.length === 0 && !isSearching && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs mt-2"
          style={{ color: "#A09A8A" }}
        >
          Start typing to search • Use ↑↓ to navigate • Enter to select • Esc to close
        </motion.p>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
