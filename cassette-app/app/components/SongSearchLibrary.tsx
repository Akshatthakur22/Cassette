'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Music, Play } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist?: string;
  durationSec?: number;
  source: 'youtube' | 'library';
  status?: string;
  thumbnailUrl?: string;
  storageKey?: string;
}

interface SongSearchLibraryProps {
  onSongsSelected?: (songs: Song[]) => void;
  maxSelections?: number;
  mode?: 'single' | 'multiple'; // single track or bulk add
}

export function SongSearchLibrary({
  onSongsSelected,
  maxSelections = 100,
  mode = 'multiple',
}: SongSearchLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<'all' | 'youtube' | 'library'>(
    'all'
  );
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'youtube' | 'library'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'duration'>('relevance');
  const [filters, setFilters] = useState({
    minDuration: 0,
    maxDuration: 600,
    ready: true,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Search songs
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSongs([]);
      return;
    }

    setLoading(true);
    try {
      // Search library first
      if (activeTab === 'all' || activeTab === 'library') {
        const libraryRes = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&source=library&limit=20`
        );
        const libraryData = await libraryRes.json();

        const librarySongs: Song[] = (libraryData.songs || []).map((s: any) => ({
          ...s,
          source: 'library' as const,
        }));

        // Search YouTube if needed
        if (activeTab === 'all' || activeTab === 'youtube') {
          const youtubeRes = await fetch(
            `/api/search?q=${encodeURIComponent(query)}&source=youtube&limit=20`
          );
          const youtubeData = await youtubeRes.json();

          const youtubeSongs: Song[] = (youtubeData.songs || []).map((s: any) => ({
            ...s,
            source: 'youtube' as const,
          }));

          setSongs([...librarySongs, ...youtubeSongs]);
        } else {
          setSongs(librarySongs);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // Toggle song selection
  const toggleSongSelection = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      if (newSelected.size < maxSelections) {
        newSelected.add(songId);
      }
    }
    setSelectedSongs(newSelected);
  };

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle add to cassette
  const handleAddToCassette = () => {
    const selectedList = songs.filter((s) => selectedSongs.has(s.id));
    if (onSongsSelected) {
      onSongsSelected(selectedList);
    }
    setSelectedSongs(new Set());
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Music className="w-6 h-6" />
          Song Library & YouTube Search
        </h2>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search songs by title, artist, or YouTube..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b p-4 bg-gray-50 flex items-center justify-between gap-4 flex-wrap">
        {/* Tabs */}
        <div className="flex gap-2">
          {(['all', 'library', 'youtube'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              {tab === 'all' && 'All'}
              {tab === 'library' && '📚 Library'}
              {tab === 'youtube' && '📺 YouTube'}
            </button>
          ))}
        </div>

        {/* Sort & Filter */}
        <div className="flex gap-2 ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'relevance' | 'duration')}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="duration">Sort: Duration</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-b p-4 bg-blue-50">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Min Duration (sec)</label>
              <input
                type="number"
                min="0"
                value={filters.minDuration}
                onChange={(e) =>
                  setFilters({ ...filters, minDuration: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Duration (sec)</label>
              <input
                type="number"
                value={filters.maxDuration}
                onChange={(e) =>
                  setFilters({ ...filters, maxDuration: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.ready}
                  onChange={(e) => setFilters({ ...filters, ready: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Library Only (READY)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Song List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mb-2"></div>
            <p>Searching...</p>
          </div>
        ) : songs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Music className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>{searchQuery ? 'No songs found' : 'Start searching to find songs'}</p>
          </div>
        ) : (
          <div className="divide-y">
            {songs.map((song) => (
              <div
                key={`${song.source}-${song.id}`}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedSongs.has(song.id)}
                  onChange={() => toggleSongSelection(song.id)}
                  className="w-5 h-5 rounded cursor-pointer"
                />

                {/* Thumbnail */}
                {song.thumbnailUrl && (
                  <img
                    src={song.thumbnailUrl}
                    alt={song.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{song.title}</h3>
                  <p className="text-sm text-gray-500">
                    {song.artist || 'Unknown Artist'} • {formatDuration(song.durationSec)}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {song.source === 'library' && song.status === 'READY' ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      ✓ In Library
                    </span>
                  ) : song.source === 'youtube' ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                      📺 YouTube
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                      {song.status}
                    </span>
                  )}

                  {/* Play Button */}
                  {song.source === 'library' && (
                    <button className="p-2 hover:bg-purple-100 rounded-full transition-colors">
                      <Play className="w-4 h-4 text-purple-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Add Button */}
      <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedSongs.size} of {maxSelections} selected
        </div>

        <button
          onClick={handleAddToCassette}
          disabled={selectedSongs.size === 0}
          className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add to Cassette ({selectedSongs.size})
        </button>
      </div>
    </div>
  );
}
