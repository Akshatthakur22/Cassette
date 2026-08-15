"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CassetteShelf from "@/app/components/CassetteShelf";

interface ShelfClientPageProps {
  initialTapes: any[];
  availableStyles: string[];
  availableRelationships: string[];
  initialSearch: string;
  initialStyle: string;
  initialRelationship: string;
  initialSort: "recent" | "popular" | "trending";
}

const TAPE_STYLE_LABELS: Record<string, string> = {
  classic: "Classic",
  y2k: "Y2K",
  love: "Love",
  road_trip: "Road Trip",
  school: "School",
  summer: "Summer",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  partner: "Partner",
  best_friend: "Best Friend",
  family: "Family",
  memory: "Memory",
  self: "Myself",
  other: "Someone",
};

export default function ShelfClientPage({
  initialTapes,
  availableStyles,
  availableRelationships,
  initialSearch,
  initialStyle,
  initialRelationship,
  initialSort,
}: ShelfClientPageProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedStyle, setSelectedStyle] = useState(initialStyle);
  const [selectedRelationship, setSelectedRelationship] = useState(
    initialRelationship
  );
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">(initialSort);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(
    (term: string, style: string, relationship: string, sort: string) => {
      setIsSearching(true);

      // Build query params
      const params = new URLSearchParams();
      if (term) params.set("search", term);
      if (style) params.set("style", style);
      if (relationship) params.set("relationship", relationship);
      if (sort !== "recent") params.set("sort", sort);

      // Push to router
      const queryString = params.toString();
      router.push(`/shelf?${queryString}`);

      setTimeout(() => setIsSearching(false), 300);
    },
    [router]
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStyle("");
    setSelectedRelationship("");
    setSortBy("recent");
    router.push("/shelf");
  };

  const hasActiveFilters =
    searchTerm || selectedStyle || selectedRelationship || sortBy !== "recent";

  return (
    <div className="w-full">
      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 w-full max-w-2xl mx-auto px-4"
      >
        {/* Search input */}
        <div className="mb-4">
          <input
            type="search"
            placeholder="Search tapes by title, creator, or recipient…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value, selectedStyle, selectedRelationship, sortBy);
            }}
            className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E5DF",
              color: "#1D1D1F",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
            aria-label="Search tapes"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {/* Style filter */}
          <select
            value={selectedStyle}
            onChange={(e) => {
              setSelectedStyle(e.target.value);
              handleSearch(searchTerm, e.target.value, selectedRelationship, sortBy);
            }}
            className="px-3 py-2 rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            style={{
              background: selectedStyle ? "#D4882A" : "#F3EFE7",
              color: selectedStyle ? "#FFFFFF" : "#5F6065",
              border: selectedStyle ? "none" : "1px solid #E8E5DF",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
            aria-label="Filter by tape style"
          >
            <option value="">All Styles</option>
            {availableStyles.map((style) => (
              <option key={style} value={style}>
                {TAPE_STYLE_LABELS[style] || style}
              </option>
            ))}
          </select>

          {/* Relationship filter */}
          <select
            value={selectedRelationship}
            onChange={(e) => {
              setSelectedRelationship(e.target.value);
              handleSearch(searchTerm, selectedStyle, e.target.value, sortBy);
            }}
            className="px-3 py-2 rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            style={{
              background: selectedRelationship ? "#D4882A" : "#F3EFE7",
              color: selectedRelationship ? "#FFFFFF" : "#5F6065",
              border: selectedRelationship ? "none" : "1px solid #E8E5DF",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
            aria-label="Filter by relationship type"
          >
            <option value="">All Vibes</option>
            {availableRelationships.map((rel) => (
              <option key={rel} value={rel}>
                {RELATIONSHIP_LABELS[rel] || rel}
              </option>
            ))}
          </select>

          {/* Sort filter */}
          <select
            value={sortBy}
            onChange={(e) => {
              const newSort = e.target.value as "recent" | "popular" | "trending";
              setSortBy(newSort);
              handleSearch(searchTerm, selectedStyle, selectedRelationship, newSort);
            }}
            className="px-3 py-2 rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            style={{
              background: sortBy !== "recent" ? "#D4882A" : "#F3EFE7",
              color: sortBy !== "recent" ? "#FFFFFF" : "#5F6065",
              border: sortBy !== "recent" ? "none" : "1px solid #E8E5DF",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
            aria-label="Sort tapes"
          >
            <option value="recent">Latest</option>
            <option value="popular">Most Played</option>
            <option value="trending">Trending</option>
          </select>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 rounded-full text-xs font-medium transition-all hover:opacity-80"
              style={{
                background: "#F3EFE7",
                color: "#8E8E93",
                border: "1px solid #E8E5DF",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
              }}
              aria-label="Clear all filters"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Results count */}
        {hasActiveFilters && (
          <p className="text-xs mt-3" style={{ color: "#8E8E93" }}>
            {initialTapes.length} {initialTapes.length === 1 ? "tape" : "tapes"} found
          </p>
        )}
      </motion.div>

      {/* Shelf */}
      {initialTapes && initialTapes.length > 0 ? (
        <CassetteShelf tapes={initialTapes as any} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <p className="text-lg mb-4" style={{ color: "#8E8E93", fontStyle: "italic" }}>
            {hasActiveFilters
              ? "No tapes match your filters."
              : "No public cassettes yet."}
          </p>
          <p className="text-sm mb-6" style={{ color: "#AAAAAA" }}>
            {hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Be the first to create one and share your vibe with the community."}
          </p>
          <a
            href="/create"
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-85"
            style={{
              background: "#F3EFE7",
              color: "#D4882A",
              textDecoration: "none",
              border: "1px solid #E8E5DF",
            }}
          >
            + Start Creating
          </a>
        </motion.div>
      )}
    </div>
  );
}
