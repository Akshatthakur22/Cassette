"use client";

import { getTapeStyleAriaLabel, getRelationshipAriaLabel, announceToScreenReader } from "@/app/lib/accessibility";

interface Track {
  id: string;
  title: string;
  artist: string;
  note?: string;
  duration?: number;
}

interface AccessibleTapeViewProps {
  title: string;
  senderName: string;
  recipientName: string;
  relationship?: string;
  style: string;
  tracks: Track[];
  createdAt?: Date;
  description?: string;
}

/**
 * Accessible tape view with semantic HTML and ARIA labels
 * Properly structured for screen readers
 */
export function AccessibleTapeView({
  title,
  senderName,
  recipientName,
  relationship,
  style,
  tracks,
  createdAt,
  description,
}: AccessibleTapeViewProps) {
  const handleTapeOpen = () => {
    const message = `Opened tape titled "${title}" from ${senderName}. This tape contains ${tracks.length} songs.`;
    announceToScreenReader(message, "polite");
  };

  const handleTrackSelect = (trackTitle: string) => {
    announceToScreenReader(`Now playing ${trackTitle}`, "polite");
  };

  return (
    <article
      role="main"
      id="tape-view"
      aria-label={`Tape titled ${title} from ${senderName}`}
      className="max-w-2xl mx-auto p-6"
      onLoad={handleTapeOpen}
    >
      {/* Header section */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        
        {/* Tape metadata */}
        <dl className="space-y-2 text-gray-700">
          <div>
            <dt className="font-semibold">From:</dt>
            <dd>{senderName || "Anonymous"}</dd>
          </div>
          
          <div>
            <dt className="font-semibold">To:</dt>
            <dd>{recipientName}</dd>
          </div>

          {relationship && (
            <div>
              <dt className="font-semibold">Relationship:</dt>
              <dd aria-label={getRelationshipAriaLabel(relationship)}>
                {relationship}
              </dd>
            </div>
          )}

          <div>
            <dt className="font-semibold">Style:</dt>
            <dd aria-label={getTapeStyleAriaLabel(style)}>
              {style}
            </dd>
          </div>

          {createdAt && (
            <div>
              <dt className="font-semibold">Created:</dt>
              <dd>
                <time dateTime={createdAt.toISOString()}>
                  {createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </dd>
            </div>
          )}
        </dl>
      </header>

      {/* Description */}
      {description && (
        <section aria-labelledby="description-heading" className="mb-8">
          <h2 id="description-heading" className="sr-only">
            Tape description
          </h2>
          <p className="text-gray-700 italic text-lg leading-relaxed">
            "{description}"
          </p>
        </section>
      )}

      {/* Tracklist */}
      <section aria-labelledby="tracklist-heading" className="mb-8">
        <h2 id="tracklist-heading" className="text-2xl font-bold text-gray-900 mb-4">
          Tracklist
        </h2>

        {tracks.length === 0 ? (
          <p className="text-gray-600 italic">No tracks added yet.</p>
        ) : (
          <ol
            role="list"
            aria-label={`${tracks.length} songs on this tape`}
            className="space-y-4"
          >
            {tracks.map((track, index) => (
              <li
                key={track.id}
                role="listitem"
                className="border-l-4 border-amber-500 pl-4 py-2"
              >
                {/* Track header */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      <span className="text-gray-500 mr-2" aria-hidden="true">
                        {index + 1}.
                      </span>
                      {track.title}
                    </h3>
                    <p className="text-sm text-gray-700">
                      by <em>{track.artist}</em>
                    </p>
                  </div>

                  {track.duration && (
                    <div className="text-sm text-gray-600 ml-4 flex-shrink-0">
                      <time dateTime={`PT${Math.floor(track.duration / 60)}M${track.duration % 60}S`}>
                        {Math.floor(track.duration / 60)}:
                        {(track.duration % 60).toString().padStart(2, "0")}
                      </time>
                    </div>
                  )}
                </div>

                {/* Track note */}
                {track.note && (
                  <div className="mt-2 p-3 bg-amber-50 rounded border border-amber-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Note: </span>
                      "{track.note}"
                    </p>
                  </div>
                )}

                {/* Play button */}
                <button
                  onClick={() => handleTrackSelect(track.title)}
                  aria-label={`Play ${track.title} by ${track.artist}`}
                  className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium underline"
                >
                  ▶️ Play track
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Actions */}
      <footer
        aria-labelledby="actions-heading"
        className="border-t pt-6 flex flex-wrap gap-3"
      >
        <h2 id="actions-heading" className="sr-only">
          Tape actions
        </h2>
        
        <button
          aria-label="Share this tape on social media or copy the link"
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
        >
          Share
        </button>

        <button
          aria-label="Report this tape for inappropriate content"
          className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition"
        >
          Report
        </button>

        <button
          aria-label="Like or favorite this tape"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          ♥️ Like
        </button>
      </footer>
    </article>
  );
}
