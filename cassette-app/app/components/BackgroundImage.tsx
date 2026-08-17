"use client";

import Image from "next/image";
import { useState } from "react";

interface BackgroundImageProps {
  imageNumber: number;
  opacity?: number;
  blendMode?: string;
  position?: "top" | "bottom" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  objectFit?: "cover" | "contain" | "fill";
  className?: string;
}

/* ─── Reusable background image component with responsive sizing ─────────── */
export function BackgroundImage({
  imageNumber,
  opacity = 0.5,
  blendMode = "normal",
  position = "center",
  objectFit = "cover",
  className = "",
}: BackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const positionMap = {
    top: "object-top",
    bottom: "object-bottom",
    center: "object-center",
    "top-left": "object-top-left",
    "top-right": "object-top-right",
    "bottom-left": "object-bottom-left",
    "bottom-right": "object-bottom-right",
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <Image
        src={`/images/optimized/${imageNumber}.png`}
        alt={`Background decoration ${imageNumber}`}
        fill
        priority={imageNumber <= 3}
        quality={85}
        sizes="100vw"
        className={`
          ${positionMap[position]}
          ${objectFit === "cover" ? "object-cover" : objectFit === "contain" ? "object-contain" : "object-fill"}
          transition-opacity duration-500
          ${isLoaded ? "opacity-100" : "opacity-0"}
        `}
        style={{
          opacity: isLoaded ? opacity : 0,
          mixBlendMode: blendMode as any,
        }}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}

/* ─── Inline background image with static dimensions ───────────────────── */
export function InlineBackgroundImage({
  imageNumber,
  opacity = 0.6,
  blendMode = "multiply",
  width = "100%",
  height = "200px",
  position = "center",
}: Omit<BackgroundImageProps, "className"> & { width?: string; height?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);

  const positionMap = {
    top: "object-top",
    bottom: "object-bottom",
    center: "object-center",
    "top-left": "object-top-left",
    "top-right": "object-top-right",
    "bottom-left": "object-bottom-left",
    "bottom-right": "object-bottom-right",
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
      }}
    >
      <Image
        src={`/images/optimized/${imageNumber}.png`}
        alt={`Background decoration ${imageNumber}`}
        fill
        quality={85}
        sizes="(max-width: 640px) 640px, (max-width: 1024px) 1024px, 100vw"
        className={`
          ${positionMap[position]}
          transition-opacity duration-700
          ${isLoaded ? "opacity-100" : "opacity-0"}
        `}
        style={{
          opacity: isLoaded ? opacity : 0,
          mixBlendMode: blendMode as any,
        }}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
