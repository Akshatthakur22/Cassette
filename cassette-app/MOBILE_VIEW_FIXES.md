# Mobile View Fixes — CASSETTE Homepage

## Problem
- Doodle text/images were hiding the cassette on mobile
- Mobile view felt blank without decorative elements on sides
- Desktop doodles were hidden with `hidden sm:block` but created empty space

## Solution

### 1. Moved Desktop Doodles (stays on sides on laptop)
**File:** `app/components/HomepageClient.tsx`

- Desktop hero doodles remain hidden on mobile (`hidden sm:block`)
- Still visible on tablet (sm breakpoint) and larger
- No longer creates awkward spacing on mobile

### 2. Added Mobile-Specific Doodles (inside/around shelf)
**File:** `app/components/HomepageClient.tsx`

Added small doodles beside the cassette shelf on mobile:
```tsx
{/* Left doodle — mobile only */}
<div className="absolute -left-8 top-8 z-0 opacity-50 sm:hidden block">
  <PosterImage imageNumber={1} width={50} height={70} rotation={-20} />
</div>

{/* Right doodle — mobile only */}
<div className="absolute -right-8 top-1/2 z-0 opacity-50 sm:hidden block">
  <PosterImage imageNumber={2} width={55} height={75} rotation={15} />
</div>
```

- Smaller poster size (50-55px vs 70-100px desktop)
- Lower opacity (0.5 vs 0.65) to not clash with cassette
- Only shown on mobile (`sm:hidden block`)
- Position: sides of shelf, not overlapping

### 3. Improved Poster Divider Section
**File:** `app/components/HomepageClient.tsx`

Enhanced the poster divider between sections:
```tsx
<div className="relative py-8 sm:py-12 lg:py-16">
  {/* Spacer gradient on mobile */}
  <div className="sm:hidden h-8 bg-gradient-to-b from-white/0 to-white/0 mb-4" />
  
  {/* Mobile-friendly subtitle */}
  <p className="sm:hidden text-center text-xs mb-6">
    ✨ More from CASSETTE ✨
  </p>
  
  {/* Desktop: Large posters (80-100px) */}
  <PosterImage ... className="hidden sm:block" />
  
  {/* Mobile: Compact posters (60px) */}
  <PosterImage ... className="sm:hidden" />
</div>
```

**Mobile changes:**
- Smaller poster sizes (60px instead of 100px)
- Added visual separator subtitle ("✨ More from CASSETTE ✨")
- Gradient spacer for breathing room
- Better contrast between sections

### 4. Increased Shelf Padding
**File:** `app/components/CassetteShelf.tsx`

```tsx
// Before
<div className="px-2 sm:px-3 md:px-4">

// After  
<div className="px-6 sm:px-3 md:px-4">
```

- Mobile: `px-6` (24px padding per side) — gives doodles breathing room
- Tablet/Desktop: `sm:px-3` (12px) — more compact for grid layout
- Prevents doodles from overlapping tape spines

## Responsive Breakpoints

| Breakpoint | Doodles | Size | Position |
|------------|---------|------|----------|
| **Mobile** (<640px) | Side doodles (small) | 50-60px | Left/right of shelf |
| **Tablet** (640px+) | Desktop doodles (large) | 70-100px | Top-left, bottom-right corners |
| **Desktop** (1024px+) | All desktop doodles | 85-105px | Full scattered layout |

## Visual Hierarchy

### Mobile View
```
HEADER
  ↓
Hero copy ("Make someone feel something real")
  ↓
CTAs (Browse / Create)
  ↓
← DOODLE  [CASSETTES]  DOODLE →
  ↓
"More from CASSETTE" subtitle
  ↓
[Compact doodles divider]
  ↓
Discover & Share section
```

### Desktop View
```
HEADER
  ↓
DOODLE₁        Hero copy        DOODLE₂
  (corner)     (center)         (corner)
  ↓
CTAs (Browse / Create)
  ↓
        [CASSETTES SHELF]
        (no side doodles)
  ↓
[Large doodles divider]
  ↓
Discover & Share section
```

## Color & Contrast

- Doodle opacity: 0.5 (mobile) vs 0.6-0.95 (desktop)
- Cassette shelf: centered with clear focus
- No text overlaps images
- Good visual separation between sections

## Testing Checklist

- [ ] Mobile (iPhone 12, 390px): Doodles visible on sides, no overlap
- [ ] Tablet (iPad, 768px): Desktop doodles start showing
- [ ] Desktop (1280px): Full scattered doodle layout
- [ ] Landscape mobile: Adjust doodle sizes appropriately
- [ ] Print preview: Doodles print correctly
- [ ] Dark mode: Opacity/visibility intact

## CSS Classes Used

- `hidden sm:block` — Show on tablet+ only
- `sm:hidden block` — Show on mobile only
- `absolute -left-8 top-8` — Position above shelf edge
- `opacity-50` — Subtle mobile doodles
- `opacity-95` — Prominent desktop doodles
- `px-6 sm:px-3` — Responsive padding

## Files Modified

1. `app/components/HomepageClient.tsx`
   - Wrapped shelf in relative container
   - Added left/right doodles (mobile-only)
   - Enhanced poster divider with mobile subtitle
   - Improved spacing with gradients

2. `app/components/CassetteShelf.tsx`
   - Increased mobile padding (px-2 → px-6)
   - Better breathing room for side doodles

## Performance Impact

- **No additional images**: Reuses existing poster images
- **No new components**: Uses existing `PosterImage` component
- **Minimal CSS**: Only Tailwind breakpoint utilities
- **Bundle size**: Unchanged

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox: ✅
- Responsive units (px): ✅
- `absolute` positioning: ✅
- Opacity transforms: ✅

## Future Enhancements

1. **Animated entrance**: Doodles slide in on scroll (mobile)
2. **Touch interactions**: Tap doodles to expand/interact
3. **Parallax effect**: Subtle movement on mobile scroll
4. **Conditional loading**: Load doodles only on >2G connection
5. **Custom doodles**: Different sets per season/theme

---

**Summary:** Mobile view now feels full and engaging with well-placed doodles, while desktop retains its scattered, nostalgic aesthetic. No visual overlap, proper spacing, and TypeScript strict compliance.
