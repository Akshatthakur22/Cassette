"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail?: string;
  durationSec?: number;
}

interface YoutubeSearchAdvancedProps {
  onSelect: (result: SearchResult) => void;
  type?: "song" | "playlist";
}

// Popular music genres for quick suggestions
const SUGGESTED_SEARCHES = [
  "Bollywood hits",
  "Lo-fi beats",
  "K-pop recent",
  "Classical instrumental",
  "Jazz standards",
  "Rock classics",
  "Hip-hop trending",
  "Indie pop",
];

const RECENT_SEARCHES_KEY = "cassette_recent_searches";

export default function YoutubeSearchAdvanced({
  onSelect,
  type = "song",
}: YoutubeSearchAdvancedProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error("Failed to load recent searches");
      }
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const endpoint =
            type === "song"
              ? `/api/search-enhanced?title=${encodeURIComponent(query.trim())}`
              : `/api/youtube/playlists/search?q=${encodeURIComponent(query.trim())}`;

          const response = await fetch(endpoint);
          if (!response.ok) throw new Error("Search failed");

          const data = await response.json();
          const searchResults = (data.results || []).slice(0, 8).map((r: any) => ({
            videoId: r.videoId,
            title: r.title,
            channelTitle: r.channelTitle,
            thumbnail: r.thumbnailUrl || r.thumbnail,
            durationSec: r.durationSec,
          }));

          setResults(searchResults);
          setSelectedIndex(0);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      });
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, type]);

  const handleSelect = (result: SearchResult) => {
    // Add to recent searches
    const updated = [
      query,
      ...recentSearches.filter((s) => s !== query),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));

    onSelect(result);
    setQuery("");
    setResults([]);
  };

  const handleSuggestedSearch = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setQuery("");
        setResults([]);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="w-full">
      {/* Search Input */}
      <div
        className="relative flex items-center rounded-xl overflow-hidden transition-all"
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
          placeholder={
            type === "song"
              ? "Search songs or artists..."
              : "Search playlists..."
          }
          className="flex-1 px-3 py-3 sm:py-3.5 text-sm sm:text-base outline-none bg-transparent"
          style={{ color: "#1D1D1F" }}
          spellCheck="false"
        />

        {/* Clear Button */}
        {query && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity flex-shrink-0 rounded-lg"
            style={{ color: "#8E8E93", minHeight: "44px" }}
            aria-label="Clear search"
          >
            ✕
          </motion.button>
        )}

        {/* Loading Indicator */}
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
      </div>

      {/* Suggestions or Recent */}
      {isFocused && !query && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mt-3 space-y-2"
        >
          {recentSearches.length > 0 && (
            <div>
              <p
                className="text-xs uppercase tracking-widest mb-2"
                style={{ color: "#8E8E93", fontFamily: "monospace" }}
              >
                Recent
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleSuggestedSearch(search)}
                    className="px-3 py-2 rounded-full text-xs transition-all hover:opacity-80"
                    style={{
                      background: "#F3EFE7",
                      border: "1px solid #E8E5DF",
                      color: "#5F6065",
                    }}
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: "#8E8E93", fontFamily: "monospace" }}
            >
              Trending
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SEARCHES.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestedSearch(suggestion)}
                  className="px-3 py-2 rounded-full text-xs transition-all hover:opacity-80"
                  style={{
                    background: "#F3EFE7",
                    border: "1px solid #E8E5DF",
                    color: "#5F6065",
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Dropdown */}
      <AnimatePresence>
        {isFocused && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-lg max-h-96 overflow-y-auto"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E5DF",
            }}
          >
            {results.map((result, idx) => (
              <motion.button
                key={result.videoId}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className="w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors flex gap-3 hover:no-underline"
                style={{
                  background:
                    selectedIndex === idx ? "#F3EFE7" : "#FFFFFF",
                  borderColor: "#F0EDE7",
                }}
                whileHover={{ x: 4 }}
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
                    {result.durationSec && ` • ${formatDuration(result.durationSec)}`}
                  </p>
                </div>

                {/* Keyboard hint */}
                {selectedIndex === idx && (
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: "#D4882A" }}
                  >
                    ↵
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
