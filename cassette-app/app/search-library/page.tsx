/**
 * /search-library
 * Browse and search song library with YouTube integration
 * Add songs to create custom cassettes
 */

'use client';

import React, { useState } from 'react';
import { SongSearchLibrary } from '@/app/components/SongSearchLibrary';

interface Song {
  id: string;
  title: string;
  artist?: string;
  durationSec?: number;
  source: 'youtube' | 'library';
  status?: string;
}

export default function SearchLibraryPage() {
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [cassetteName, setCassetteName] = useState('My Cassette');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const handleSongsSelected = (songs: Song[]) => {
    setSelectedSongs([...selectedSongs, ...songs]);
    setMessage(`Added ${songs.length} song(s)!`);
    setTimeout(() => setMessage(''), 3000);
  };

  const removeSong = (index: number) => {
    setSelectedSongs(selectedSongs.filter((_, i) => i !== index));
  };

  const handleCreateCassette = async () => {
    if (selectedSongs.length === 0) {
      setMessage('Select at least one song');
      return;
    }

    setCreating(true);
    try {
      // Filter for library songs only (YouTube songs would need to be downloaded first)
      const librarySongs = selectedSongs.filter((s) => s.source === 'library');

      if (librarySongs.length === 0) {
        setMessage('Select songs from your library (YouTube songs need to be downloaded first)');
        setCreating(false);
        return;
      }

      const tracks = librarySongs.map((song, idx) => ({
        title: song.title,
        providerTrackId: song.id,
        mediaAssetId: song.id,
        side: idx < Math.ceil(librarySongs.length / 2) ? 'A' : 'B',
        position: idx % 2,
        provider: 'media_asset',
      }));

      const response = await fetch('/api/debug/create-tape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'Music Creator',
          recipientName: 'Friend',
          relationship: 'best_friend',
          style: 'classic',
          visibility: 'public',
          title: cassetteName,
          dedication: `A custom cassette with ${librarySongs.length} songs`,
          tracks,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(
          `✅ Cassette created! Share: /t/${result.publicId}`
        );
        setCassetteName('My Cassette');
        setSelectedSongs([]);
        window.location.href = `/t/${result.publicId}`;
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error creating cassette: ${error}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎵 Build Your Cassette
          </h1>
          <p className="text-lg text-gray-600">
            Search our library or YouTube, then create your custom cassette
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Search Component */}
          <div className="lg:col-span-2">
            <SongSearchLibrary
              onSongsSelected={handleSongsSelected}
              maxSelections={50}
            />
          </div>

          {/* Cassette Builder Sidebar */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <h2 className="text-xl font-bold">📀 Your Cassette</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Message */}
              {message && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                  {message}
                </div>
              )}

              {/* Cassette Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cassette Name
                </label>
                <input
                  type="text"
                  value={cassetteName}
                  onChange={(e) => setCassetteName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="My awesome cassette"
                />
              </div>

              {/* Selected Songs List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Selected Songs ({selectedSongs.length})
                </h3>

                {selectedSongs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Search and select songs to start</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedSongs.map((song, idx) => (
                      <div
                        key={`${song.source}-${song.id}-${idx}`}
                        className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-gray-900">
                            {song.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {song.artist || 'Unknown'}
                          </p>
                        </div>
                        <button
                          onClick={() => removeSong(idx)}
                          className="text-red-500 hover:text-red-700 font-bold flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 rounded text-xs text-gray-700">
                <p className="font-medium mb-1">💡 Tip:</p>
                <p>Library songs can be added directly. YouTube songs need to be downloaded first.</p>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateCassette}
                disabled={selectedSongs.length === 0 || creating}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
              >
                {creating ? 'Creating...' : '🎬 Create Cassette'}
              </button>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedSongs.filter((s) => s.source === 'library').length}
                  </div>
                  <div className="text-xs text-gray-600">Library</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {selectedSongs.filter((s) => s.source === 'youtube').length}
                  </div>
                  <div className="text-xs text-gray-600">YouTube</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
