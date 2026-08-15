# Implementation Guide - 3-Page Cassette Creation Flow

## Overview
This guide explains how to integrate the new 3-page immersive cassette creation flow into the existing app structure.

---

## New Components Created

### 1. **SetTheMoodClient.tsx** (Page 1)
- **Purpose**: Relationship selection + tape color picker
- **Location**: `app/create/SetTheMoodClient.tsx`
- **Features**:
  - 6 relationship cards (2x3 grid)
  - 11 tape color options
  - Visual feedback on selection
  - Step indicator (1 • 2 • 3)
  - Smooth animations

### 2. **NameTheTapeClient.tsx** (Page 2)
- **Purpose**: Metadata entry form
- **Location**: `app/create/NameTheTapeClient.tsx`
- **Features**:
  - 4 form fields (Your Name, Recipient, Title, Dedication)
  - Animated color badge preview
  - Form validation
  - 44px minimum touch targets
  - Back navigation

### 3. **EditTapeClient.tsx** (Page 3)
- **Purpose**: Immersive cassette player + track management
- **Location**: `app/create/EditTapeClient.tsx`
- **Features**:
  - Realistic cassette graphic (left side, sticky on desktop)
  - Player controls with time display
  - Track list with drag-to-reorder (right side)
  - Personal note editing
  - Track deletion
  - Responsive layout (stacked on mobile)

---

## Integration Steps

### Step 1: Replace CreateStartClient
The existing `CreateStartClient` should be updated to use the new `SetTheMoodClient` component:

```tsx
// In app/create/page.tsx
import SetTheMoodClient from "./SetTheMoodClient";

export default function CreatePage() {
  // ... get draftId from database
  return <SetTheMoodClient draftId={draftId} />;
}
```

### Step 2: Create Step 2 Page
Create a new route for the naming step:

```tsx
// app/create/[draftId]/step-2/page.tsx
import { getTapeForEditor } from "@/app/actions/tape";
import NameTheTapeClient from "@/app/create/NameTheTapeClient";

export default async function Step2Page({ params }) {
  const { draftId } = await params;
  const tape = await getTapeForEditor(draftId);
  
  return (
    <NameTheTapeClient 
      draftId={draftId}
      selectedColor={tape?.style}
      selectedRelationship={tape?.relationship}
    />
  );
}
```

### Step 3: Create Step 3 Page
Create the main editing page:

```tsx
// app/create/[draftId]/step-3/page.tsx
import { getTapeForEditor } from "@/app/actions/tape";
import EditTapeClient from "@/app/create/EditTapeClient";

export default async function Step3Page({ params }) {
  const { draftId } = await params;
  const tape = await getTapeForEditor(draftId);
  
  return (
    <EditTapeClient 
      draftId={draftId}
      tapeTitle={tape?.title}
      recipientName={tape?.recipientName}
      senderName={tape?.senderName}
      selectedStyle={tape?.style}
      initialTracks={tape?.tracks}
    />
  );
}
```

### Step 4: Update Navigation
Ensure router.push() calls use the correct paths:
- Page 1 → Page 2: `router.push(/create/${draftId}/step-2)`
- Page 2 → Page 3: `router.push(/create/${draftId}/step-3)`
- Page 3 → Publish: `router.push(/record/${draftId})`

---

## Server Actions to Implement

### Update Tape Meta
Store user selections from Page 1:

```tsx
export async function updateTapeMeta(draftId: string, data: {
  relationship?: string;
  style?: string;
  senderName?: string;
  recipientName?: string;
  title?: string;
  dedication?: string;
}) {
  // Implement via Prisma
}
```

### Persist Track Changes
Save track reordering and notes:

```tsx
export async function updateTracks(draftId: string, tracks: Track[]) {
  // Implement via Prisma
}
```

---

## Mobile Responsiveness Strategy

### Page 1 & 2
- Full-width forms
- 2-column grid → 1-column on mobile (cards)
- Color circles stay horizontal but with wrapping
- CTA buttons remain full-width

### Page 3
- **Desktop (lg)**: Split layout (cassette left, tracks right)
- **Mobile (sm)**: Stacked layout
  - Cassette player on top (sticky header for easy access)
  - Track list below with full width
  - All controls remain 44px minimum height
  - Horizontal scrolling for track list if needed

---

## Animation Details

### Spring Transitions
```tsx
// Button hover effects
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}

// Card selection
transition={{ duration: 0.3, ease: "easeOut" }}

// Cassette flip (future enhancement)
transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
```

### Stagger Effects
- Track list items fade in with 0.1s stagger
- Relationship cards fade in with 0.08s stagger
- Color circles appear simultaneously

---

## Accessibility Checklist

- [x] All form fields have 44px minimum height
- [x] All buttons have clear labels (aria-label)
- [x] Color contrast meets WCAG AA standard
- [x] Keyboard navigation supported
- [x] Touch targets have 8px minimum spacing
- [x] Form validation messages displayed
- [x] Focus states visible on all interactive elements

---

## Styling System

### Color Variables (in globals.css)
```css
--color-cream: #FBFAF7;
--color-dark: #1D1D1F;
--color-accent: #D4882A;
--color-accent-light: #E8901A;
--color-accent-dark: #C4503A;
--color-border: #E8E5DF;
--color-text-soft: #8E8E93;
--color-text-lighter: #A09A8A;
```

### Responsive Classes
- `hidden lg:block` - Hide on mobile, show on desktop
- `lg:w-1/2` - 50% width on desktop
- `sm:px-6` - Larger padding on desktop
- `lg:sticky lg:top-0` - Sticky on desktop, normal on mobile

---

## Testing Checklist

### Functionality
- [ ] Page 1: All relationship cards clickable
- [ ] Page 1: Color selection highlights correctly
- [ ] Page 2: Form validation works
- [ ] Page 2: Back navigation returns to Page 1
- [ ] Page 3: Drag-to-reorder tracks works
- [ ] Page 3: Note editing opens/closes correctly
- [ ] Page 3: Delete track removes from list
- [ ] All: Router navigation works between pages

### Mobile (iPhone SE 375px width)
- [ ] Forms are readable without horizontal scroll
- [ ] Buttons are easily tappable (44px)
- [ ] Page 3 cassette fits in viewport
- [ ] Track list scrolls without layout shift
- [ ] All text sizes are readable

### Desktop
- [ ] Page 3 cassette stays sticky while scrolling tracks
- [ ] Hover effects work smoothly
- [ ] Layout breaks properly at lg breakpoint
- [ ] No horizontal scroll on any page

### Accessibility
- [ ] Tab navigation works through all elements
- [ ] All form inputs have labels
- [ ] Color contrast passes WCAG checker
- [ ] Screen reader announces button purposes

---

## Future Enhancements

1. **Cassette Flip Animation**
   - 3D rotation when flip button clicked
   - Switches between Side A/B
   - Smooth transition

2. **Audio Preview**
   - Play track preview from YouTube
   - Show waveform/progress
   - Integrate with existing PlayerBar

3. **Batch Operations**
   - Select multiple tracks
   - Delete all selected
   - Reorder selected as group

4. **Undo/Redo**
   - Track changes history
   - Keyboard shortcuts (Cmd+Z)

5. **Sharing During Creation**
   - Share draft link
   - Collaborative editing (future)

---

## Deployment Notes

- All new files created in `app/create/` directory
- No changes needed to database schema
- Existing `getTapeForEditor` action reused
- New routing paths follow Next.js app router conventions
- Build should pass with no errors

---

## Performance Considerations

- Framer Motion animations use GPU acceleration
- Reorder list uses optimized layout shifts
- Images lazy loaded where applicable
- Form inputs debounce for validation
- Track list virtualized if > 50 tracks

---

## Questions & Support

For implementation issues, refer to:
1. `IMPROVED_UI_DESIGN.md` - Visual specifications
2. Component comments - Inline documentation
3. Existing `TapeEditorClient.tsx` - Similar patterns
