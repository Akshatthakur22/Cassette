/**
 * Image optimization utilities
 * Provides helpers for WebP/AVIF image serving with fallbacks
 */

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

/**
 * Generate srcset for modern image formats with fallbacks
 * Returns data suitable for <picture> element
 */
export function getOptimizedImageSrcSet(basePath: string) {
  return {
    avif: {
      srcset: `${basePath}?format=avif&quality=80`,
      type: "image/avif",
    },
    webp: {
      srcset: `${basePath}?format=webp&quality=85`,
      type: "image/webp",
    },
    jpg: {
      srcset: basePath,
      type: "image/jpeg",
    },
  };
}

/**
 * Generate Next.js Image component with optimized formats
 * Example usage:
 * <Image
 *   src={getOptimizedImagePath("/images/poster.jpg")}
 *   alt="Poster"
 *   width={300}
 *   height={400}
 *   quality={85}
 * />
 */
export function getOptimizedImagePath(path: string): string {
  // Next.js Image component automatically handles:
  // - WebP conversion
  // - AVIF for supported browsers
  // - Responsive sizing
  // - Lazy loading
  return path;
}

/**
 * Get image dimensions for responsive images
 */
export function getImageDimensions(imageName: string): { width: number; height: number } {
  const dimensions: Record<string, { width: number; height: number }> = {
    poster: { width: 300, height: 420 },
    background: { width: 1920, height: 1080 },
    ogimage: { width: 1200, height: 630 },
    thumbnail: { width: 150, height: 150 },
    hero: { width: 800, height: 600 },
  };

  return dimensions[imageName] || { width: 800, height: 600 };
}

/**
 * CSS for picture element with format-specific media queries
 */
export const pictureElementStyles = `
  picture {
    display: contents;
  }

  img {
    content-visibility: auto;
    will-change: auto;
  }
`;

/**
 * HTML snippet for responsive picture element
 * Can be used in server components
 */
export function generatePictureHTML(
  basePath: string,
  alt: string,
  width?: number,
  height?: number
): string {
  return `
<picture>
  <source 
    srcset="${basePath}?format=avif&quality=80"
    type="image/avif"
  />
  <source 
    srcset="${basePath}?format=webp&quality=85"
    type="image/webp"
  />
  <img 
    src="${basePath}" 
    alt="${alt}"
    loading="lazy"
    decoding="async"
    ${width ? `width="${width}"` : ""}
    ${height ? `height="${height}"` : ""}
  />
</picture>
  `.trim();
}

/**
 * Image optimization configuration for build tools
 * Can be used in next.config.js or build pipeline
 */
export const imageOptimizationConfig = {
  formats: ["image/avif", "image/webp"],
  deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
};

/**
 * Preload images for better performance
 * Returns link tag HTML
 */
export function generatePreloadLink(
  href: string,
  format: "avif" | "webp" | "jpg" = "webp"
): string {
  const typeMap = {
    avif: "image/avif",
    webp: "image/webp",
    jpg: "image/jpeg",
  };

  return `<link rel="preload" as="image" href="${href}" type="${typeMap[format]}" />`;
}
