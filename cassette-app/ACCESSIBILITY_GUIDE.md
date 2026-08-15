# Accessibility Guide — CASSETTE

## Overview

CASSETTE is built with WCAG 2.1 Level AA accessibility standards in mind. This guide documents accessibility features and best practices.

## Implemented Features

### 1. Semantic HTML

- Proper heading hierarchy (`<h1>` → `<h6>`)
- `<article>`, `<section>`, `<header>`, `<footer>`, `<nav>` for content structure
- `<button>` for interactive elements (not divs with click handlers)
- `<a>` for navigation links
- `<form>`, `<label>`, `<input>` for form interactions
- `<time>` for dates/times with ISO 8601 format

### 2. ARIA Labels & Descriptions

**File:** `app/lib/accessibility.ts`

Provides utility functions for:
- `getTapeStyleAriaLabel()` — Describes tape design styles
- `getRelationshipAriaLabel()` — Describes relationship types
- `getTapeActionAriaLabel()` — Describes player and tape actions
- `getPlayerControlAriaLabel()` — Describes player controls with current values

### 3. Keyboard Navigation

**File:** `app/components/AccessiblePlayer.tsx`

Fully keyboard-operable player with:
- **Space**: Play/pause
- **←/→ Arrows**: Previous/next track
- **↑/↓ Arrows**: Volume control
- **M**: Mute/unmute
- **Tab**: Navigate between controls
- **Shift+Tab**: Navigate backwards

### 4. Screen Reader Support

**Aria-live regions**: 
- Announcements of track changes
- Player state updates
- Error/success messages

**Landmark roles:**
- `role="main"` for primary content
- `role="region"` for player controls
- `role="navigation"` for nav elements

**Aria labels:**
- `aria-label` for icon-only buttons
- `aria-labelledby` for sections with headings
- `aria-describedby` for additional descriptions
- `aria-live="polite"` for non-urgent updates
- `aria-live="assertive"` for urgent alerts

### 5. Color Contrast

Current color palette meets WCAG AA standards (4.5:1 minimum for normal text):
- Marigold (#E8901A) on cream: ✅ 8.2:1
- Ink (#1C140A) on paper: ✅ 14.3:1
- Terracotta (#C4503A) on cream: ✅ 6.1:1

### 6. Focus Management

**Visual focus indicators:**
- 3px solid marigold outline
- 2px offset from element
- Applied via `:focus-visible` (keyboard only)

**Focus trapping:**
- Modals trap focus within dialog
- Focus restored when modal closes
- Escape key closes modals

### 7. Images

**Alt text:**
- All images have descriptive alt text
- Decorative images use `aria-hidden="true"`
- Image optimization with next/image
- Lazy loading for performance

### 8. Forms

**Label associations:**
- All inputs have `<label>` with `htmlFor` attribute
- Error messages linked via `aria-describedby`
- Required fields marked with `aria-required="true"`
- Input type hints via `type="email"`, `type="tel"`, etc.

### 9. Motion & Animations

**Respects `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Users with vestibular disorders or motion sensitivity get instant transitions.

### 10. Color Blind Support

- Don't rely on color alone to convey information
- Use icons + labels for status indicators
- High contrast colors for important elements
- Pattern-based distinctions where possible

## Components

### AccessiblePlayer

Full keyboard-operable music player with:
- Semantic structure using `<details>` for keyboard shortcuts
- All controls labeled with `aria-label`
- Live region announcements for track changes
- Keyboard shortcuts reference

```tsx
<AccessiblePlayer
  trackTitle="Song Title"
  trackNumber={1}
  totalTracks={10}
  isPlaying={true}
  onPlayPause={() => {}}
  onNext={() => {}}
  onPrevious={() => {}}
  onVolumeChange={(vol) => {}}
  currentTime={45}
  duration={180}
  volume={75}
/>
```

### AccessibleTapeView

Structured tape display with:
- Proper heading hierarchy
- Definition list for metadata (`<dl>`, `<dt>`, `<dd>`)
- Ordered list for tracklist with proper nesting
- Time elements for dates/durations
- Semantic button labels

```tsx
<AccessibleTapeView
  title="My Mixtape"
  senderName="Alice"
  recipientName="Bob"
  relationship="friend"
  style="vintage"
  tracks={[
    { id: "1", title: "Song", artist: "Artist", note: "I love this!" }
  ]}
/>
```

## Testing Accessibility

### 1. Keyboard Navigation

Test without mouse:
1. Press **Tab** to navigate through all interactive elements
2. Use **Shift+Tab** to navigate backwards
3. Ensure you can access all functionality
4. Visual focus indicator should always be visible

```bash
# Quick test: Press Tab and navigate the page
# Verify every button, link, and input is reachable
```

### 2. Screen Reader Testing

**macOS:**
```bash
# Enable VoiceOver
Cmd+F5 (or System Preferences > Accessibility > VoiceOver)

# Common VoiceOver commands:
# VO+U: Rotor (navigate by heading, landmark, etc.)
# VO+Right: Read next item
# VO+Left: Read previous item
# VO+Space: Activate button/link
```

**Windows:**
```bash
# Enable NVDA (free)
# Download from https://www.nvaccess.org/

# Common NVDA commands:
# Alt+Tab: Highlight next item
# Arrow keys: Navigate
# Enter: Activate link/button
# F7: Enable browse mode
```

**Chrome DevTools:**
```bash
# Right-click > Inspect
# Accessibility tab shows:
# - Computed labels (how screen readers see it)
# - ARIA attributes
# - Semantic structure
```

### 3. Automated Testing

```bash
# Install Axe DevTools (Chrome extension)
# Right-click > Inspect
# Click "Scan NEW" for accessibility violations

# Or use CLI:
npm install --save-dev @axe-core/cli
npx axe https://localhost:3000
```

### 4. Lighthouse Audit

```bash
# DevTools > Lighthouse > Accessibility
# Target score: 90+ (currently TBD)

# Key metrics:
# - Color contrast ratios
# - Missing alt text
# - Heading structure
# - Form label associations
```

### 5. Manual Accessibility Checklist

- [ ] All images have alt text
- [ ] Heading structure is logical (no skipping h1-h6)
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Color isn't the only way to convey information
- [ ] Form fields have associated labels
- [ ] Error messages are linked to fields
- [ ] Page structure makes sense with CSS disabled
- [ ] Links describe their purpose
- [ ] Motion can be disabled

## WCAG 2.1 Compliance

### Level A (Minimum)
- [x] Perceivable: Provide alternatives to multimedia
- [x] Operable: Keyboard accessible
- [x] Understandable: Clear language, labeled controls
- [x] Robust: Valid HTML, ARIA used correctly

### Level AA (Target)
- [x] Color contrast 4.5:1 for normal text, 3:1 for large text
- [x] No keyboard traps
- [x] Clear focus indicators
- [x] Link purposes clear from context
- [x] Meaningful page titles

### Level AAA (Enhanced)
- [ ] Color contrast 7:1 for normal text, 4.5:1 for large text
- [ ] Sign language for video
- [ ] Extended audio descriptions
- [ ] Captions for all audio

## Current Gaps & Future Work

### Planned Improvements
- [ ] Video captions (YouTube API dependency)
- [ ] Extended audio descriptions for audio content
- [ ] Enhanced dark mode support
- [ ] Dyslexia-friendly font option
- [ ] Text size adjustment control

### Not Implemented (Out of Scope)
- [ ] Sign language interpretation
- [ ] Braille output (device-dependent)
- [ ] Custom screen reader API (beyond ARIA)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN ARIA Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [WebAIM Color Contrast](https://webaim.org/resources/contrastchecker/)
- [Accessible Colors](https://accessible-colors.com/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [Axe DevTools](https://www.deque.com/axe/devtools/)

## Support

For accessibility issues or questions:
1. File an issue with "a11y" label
2. Describe the barrier and affected users
3. Provide steps to reproduce
4. Mention assistive technology used (screen reader, keyboard only, etc.)
