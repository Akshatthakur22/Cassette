"use client";

import Image from "next/image";
import { useState } from "react";

interface PosterImageProps {
  imageNumber: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  className?: string;
}

/* ─── Small poster-like image component for scattered placement ─────────── */
export function PosterImage({
  imageNumber,
  width = 120,
  height = 160,
  rotation = 0,
  opacity = 0.85,
  className = "",
}: PosterImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-sm shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-105 ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        opacity: isLoaded ? opacity : 0,
      }}
    >
      <Image
        src={`/images/optimized/${imageNumber}.png`}
        alt={`Poster ${imageNumber}`}
        fill
        sizes="(max-width: 768px) 50px, (max-width: 1024px) 70px, 100px"
        quality={85}
        className="object-cover"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.5s ease-in-out",
        }}
        onLoad={() => setIsLoaded(true)}
      />
      {/* Film frame effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.3)",
          border: "2px solid rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
}

/* ─── Random poster grid for scattered placement ───────────────────────── */
export function RandomPosterGrid() {
  const posters = [
    { num: 1, width: 100, height: 140, rotation: -8 },
    { num: 2, width: 110, height: 150, rotation: 5 },
    { num: 3, width: 95, height: 130, rotation: -3 },
    { num: 4, width: 105, height: 145, rotation: 7 },
    { num: 5, width: 100, height: 140, rotation: -5 },
    { num: 6, width: 115, height: 155, rotation: 3 },
    { num: 7, width: 100, height: 140, rotation: -6 },
    { num: 8, width: 110, height: 150, rotation: 4 },
    { num: 9, width: 105, height: 145, rotation: -4 },
    { num: 10, width: 100, height: 140, rotation: 6 },
    { num: 11, width: 110, height: 150, rotation: -7 },
    { num: 12, width: 95, height: 130, rotation: 2 },
  ];

  return (
    <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-start">
      {posters.map((poster) => (
        <PosterImage
          key={poster.num}
          imageNumber={poster.num}
          width={poster.width}
          height={poster.height}
          rotation={poster.rotation}
          opacity={0.85}
        />
      ))}
    </div>
  );
}
