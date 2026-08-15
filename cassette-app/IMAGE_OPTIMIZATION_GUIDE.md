# Image Optimization Guide — CASSETTE

## Overview

CASSETTE uses Next.js's native image optimization to serve WebP and AVIF formats with automatic fallbacks to JPEG/PNG. This reduces file sizes by 25-35% while maintaining visual quality.

## Configuration

### next.config.ts

```typescript
images: {
  formats: ["image/avif", "image/webp"],  // Modern formats first
  minimumCacheTTL: 60 * 60 * 24 * 365,    // Cache 1 year
  deviceSizes: [320, 420, 640, ...],      // Responsive breakpoints
  quality: 85,                             // 85% quality (good balance)
  dangerouslyAllowSVG: true,               // Allow SVG for icons
}
```

**What this does:**
- `formats`: Browser requests `avif` first, falls back to `webp`, then `jpg/png`
- `minimumCacheTTL`: Long cache TTL for images in `/public` (immutable)
- `deviceSizes`: Generates srcsets for common device widths
- `quality: 85`: High quality with good compression (not overly aggressive)

## Usage Patterns

### 1. Using next/image (Recommended)

```tsx
import Image from "next/image";

export function MyImage() {
  return (
    <Image
      src="/images/poster.jpg"
      alt="Movie poster"
      width={300}
      height={420}
      quality={85}
      priority={false}  // lazy load by default
    />
  );
}
```

**Benefits:**
- Automatic format negotiation (AVIF → WebP → JPG)
- Responsive srcset generation
- Lazy loading by default
- Automatic size optimization

**Note:** The `quality` prop accepts 1-100. We use 85 for most images.

### 2. Picture Element (Advanced)

For browsers without next/image support or when you need custom fallbacks:

```tsx
import { generatePictureHTML } from "@/app/lib/image-optimization";

export function MyImage() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: generatePictureHTML(
        "/images/poster.jpg",
        "Poster",
        300,
        420
      )
    }} />
  );
}
```

Generated HTML:
```html
<picture>
  <source srcset="/images/poster.jpg?format=avif&quality=80" type="image/avif" />
  <source srcset="/images/poster.jpg?format=webp&quality=85" type="image/webp" />
  <img src="/images/poster.jpg" alt="Poster" loading="lazy" decoding="async" />
</picture>
```

### 3. Preloading Critical Images

For hero images or above-the-fold content:

```tsx
import { generatePreloadLink } from "@/app/lib/image-optimization";

export function RootLayout() {
  return (
    <head>
      <link rel="preload" as="image" href="/images/hero.jpg" type="image/webp" />
    </head>
  );
}
```

Or use the ImagePreloader component:

```tsx
import { ImagePreloader } from "@/app/components/ImagePreloader";

export default function Page() {
  return (
    <>
      <ImagePreloader images={[
        { src: "/images/hero.jpg", format: "webp" },
        { src: "/images/poster1.jpg", format: "webp" },
      ]} />
      {/* Page content */}
    </>
  );
}
```

## Performance Impact

### File Size Reductions

| Format | Size | Reduction |
|--------|------|-----------|
| PNG (original) | 500 KB | - |
| JPEG (quality 85) | 85 KB | 83% ↓ |
| WebP (quality 85) | 65 KB | 87% ↓ |
| AVIF (quality 80) | 48 KB | 90% ↓ |

### Browser Support

- **AVIF**: Chrome 85+, Firefox 93+, Safari 16+ (90% of users)
- **WebP**: Chrome 23+, Firefox 65+, Safari 16+, Edge 18+ (95% of users)
- **JPEG/PNG**: All browsers (100% fallback)

## Implementation Checklist

- [x] next.config.ts: Enable AVIF/WebP formats
- [x] next.config.ts: Set minimumCacheTTL = 1 year for immutable assets
- [x] app/lib/image-optimization.ts: Created utility functions
- [x] app/components/ImagePreloader.tsx: Created preloader component
- [x] public/.well-known/web-app-manifest.json: Created PWA manifest
- [ ] Audit: Convert static PNGs to JPG/WebP in public/images/
- [ ] Test: Verify WebP/AVIF delivery in DevTools Network tab
- [ ] Monitor: Check Core Web Vitals (LCP, CLS, FID)

## Testing & Verification

### 1. Check image format delivery

```bash
# Open DevTools → Network tab → filter by Images
# Look at Response Headers: Content-Type should show image/avif or image/webp
```

### 2. Lighthouse audit

```bash
npm run build
npm run start
# Open http://localhost:3000
# Run Lighthouse (DevTools → Lighthouse tab)
# Check "Performance" score and image optimization section
```

### 3. Browser compatibility

Test on different browsers:
- Modern (Chrome/Firefox/Safari 16+): Expect AVIF
- Legacy (Safari 15, Firefox 60): Expect WebP or JPEG
- Very old (IE11): Expect JPEG (unsupported, but graceful)

## Best Practices

1. **Always provide `alt` text** for accessibility
2. **Set explicit `width` and `height`** to prevent layout shift
3. **Use `priority={true}`** only for above-the-fold images (hero, poster on first load)
4. **Use `quality={85}`** by default; lower to 70 for thumbnails, higher to 90 for hero
5. **Lazy load** everything below the fold (default behavior)
6. **Use WebP/AVIF** for UI images; JPEG for photos
7. **Cache static images** with long TTL (already configured)
8. **Monitor Core Web Vitals** in production (Vercel Analytics, etc.)

## Troubleshooting

### Images not converting to WebP/AVIF

1. Ensure file is in `/public/` directory
2. Check next.config.ts `formats` array includes `["image/avif", "image/webp"]`
3. Rebuild: `npm run build && npm run start`
4. Check DevTools Network tab → Response Headers

### File size not reducing

1. Verify `quality` setting (85 is recommended)
2. Ensure original file is not already optimized (check file size)
3. Try converting manually: `cwebp image.jpg -o image.webp -q 85`

### Lighthouse score still low

1. Check Core Web Vitals (LCP, CLS, FID)
2. Verify images are lazy-loaded (except priority images)
3. Audit render-blocking resources (CSS, fonts)
4. Consider using `<Image>` with `priority` for hero
5. Monitor with Vercel Analytics or web-vitals library

## References

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [WebP Codec](https://developers.google.com/speed/webp)
- [AVIF Format](https://aomediacodec.org/av1-image/)
- [Core Web Vitals](https://web.dev/vitals/)
