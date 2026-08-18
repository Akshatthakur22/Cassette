/**
 * ImagePreloader Component
 * Preloads critical images for faster perceived performance
 * Used in head to hint browser to fetch images early
 */

interface ImagePreloaderProps {
  images: Array<{
    src: string;
    format?: "avif" | "webp" | "jpg" | "png";
  }>;
}

export function ImagePreloader({ images }: ImagePreloaderProps) {
  return (
    <>
      {images.map((image) => {
        const typeMap = {
          avif: "image/avif",
          webp: "image/webp",
          jpg: "image/jpeg",
          png: "image/png",
        };
        const format = image.format || "webp";

        return (
          <link
            key={image.src}
            rel="preload"
            as="image"
            href={image.src}
            type={typeMap[format]}
          />
        );
      })}
    </>
  );
}
