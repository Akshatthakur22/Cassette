# Cassette UI/UX Redesign - 3 Page Flow

## Overview
Redesign the tape creation flow into 3 immersive pages with a realistic cassette player interface that feels tactile and authentic.

---

## Page 1: "Set the Mood" - Relationship & Color Selection

### Purpose
Let users choose who the tape is for and set the visual vibe.

### Layout
- **Header**: CASSETTE logo + step counter (1 • 2 • 3) + Save Draft
- **Heading**: "WHO IS THIS TAPE FOR?" (small caps, gray)
- **Title**: "Set the mood." (large, italic, serif)
- **Relationship Cards**: 2x3 grid
  - Each card has emoji + title + description
  - Cards: For My Love, Best Friend, Family, A Memory, Just for Me, Just Because
  - Selected card has orange border + filled background
- **Color Selector**: Horizontal row with 11 tape colors
  - Each color is a circle with label below
  - Selected color has dark border + glow
- **CTA Button**: "Next →" (large, gradient orange, full width)

### Visual Details
- Background: #FBFAF7 (cream)
- Card styling: white background, subtle shadow on hover
- Selected relationship card: orange border (2px), light orange background
- Color circles: 48px diameter, centered labels
- Spacing: Generous padding, mobile-first responsive

---

## Page 2: "Name the Tape" - Metadata Entry

### Purpose
Collect tape details: names, title, and optional dedication.

### Layout
- **Header**: CASSETTE logo + step counter (1 • 2 • 3) + Save Draft
- **Back Link**: "← Back" (small)
- **Tape Badge**: Circular preview of selected color
- **Heading**: "Name the tape." (italic, serif)
- **Subtitle**: "You can always change these later." (small, gray)
- **Form Fields** (vertical stack):
  1. YOUR NAME * (required)
  2. RECIPIENT'S NAME * (required, can be "You")
  3. TAPE TITLE (optional)
  4. DEDICATION (OPTIONAL) - larger textarea
- **CTA Button**: "Start adding songs →" (gradient orange)

### Visual Details
- Form inputs: #F3EFE7 background, #E8E5DF border on focus
- Labels: Small caps, #8E8E93 gray
- Inputs: 44px minimum height (accessibility)
- Placeholder text: Light gray, helpful tone
- Tape badge: 80px diameter, positioned top-center
- Mobile: Full-width fields with proper spacing

---

## Page 3: "Edit Tape" - Immersive Cassette Player

### Purpose
Main editing interface with realistic cassette visualization + track management.

### Layout - LEFT SIDE (Cassette Player)
- **Header**: CASSETTE logo + step counter (1 • 2 • 3) + Save Draft
- **Position Counter**: "90" (in top-left, tiny) + "1:11" + "POSITION"
- **Cassette Image**: 
  - Large, realistic cassette graphic (300-400px wide)
  - Label strip showing: SIDE, Title, Recipient, From Sender
  - Hover reveals menu: Tracks, Design, Label, Message, Preview
  - Flip button: Top-right corner
- **Time Display**: Digital display showing 0:12
- **Player Controls**: Below cassette
  - Previous | Play (large) | Next | Volume controls
  - Progress bar with scrubber
- **Left Sidebar Menu** (hidden on mobile):
  - Tracks
  - Design
  - Label
  - Message
  - Preview

### Layout - RIGHT SIDE (Track List)
- **Section Header**: "SIDE A" + duration "6 tracks • 28:46"
- **Track List**: Each track shows:
  - Position number + Song title + Artist
  - Duration on right (3:31)
  - Hover: Edit note icon + Delete icon (trash)
  - Personal note if exists (italic, colored background)
- **Add Song Button**: "+ Add Song" or "+ Add from Playlist"
- **Side Switcher**: Tab between "SIDE A" and "SIDE B"

### Visual Details
- **Cassette Player Section**:
  - Dark background (#3A3028) around cassette
  - Cassette has realistic shadow + depth
  - 3D-like appearance with beveled buttons
  - Flip button: Circular, positioned at top-right
- **Track List**:
  - White background
  - Subtle borders between tracks
  - Hover state: Light background change
  - Delete button appears on hover (trash icon, #C4503A)
- **Mobile Responsive**:
  - Stack player on top, tracks below
  - Full-width player
  - Sidebar menu becomes bottom nav or modal

### Interactions
- Click cassette to show/expand menu
- Flip button rotates cassette + switches SIDE A/B
- Drag tracks to reorder
- Click track to preview
- Hover track to edit/delete
- Player controls work with keyboard

---

## Key UX Improvements

1. **Visual Hierarchy**: Large cassette image dominates the interface
2. **Tactile Feedback**: Hover states, animations, depth
3. **Mobile-First**: Responsive stacking, touch-friendly targets (44px min)
4. **Clear Steps**: Visual progress indicator (1 • 2 • 3)
5. **Contextual Actions**: Menus appear when needed
6. **Accessibility**: Proper labels, keyboard navigation, color contrast
7. **Immersion**: Cassette aesthetic throughout, realistic interactions

---

## Color Palette

- **Background**: #FBFAF7 (cream)
- **Dark**: #060408, #3A3028
- **Accent**: #D4882A (orange)
- **Gradient**: #E8901A → #C4503A
- **Text**: #1D1D1F (dark), #8E8E93 (gray), #D9D7D1 (light)
- **Borders**: #E8E5DF (subtle)
- **Hover**: #F3EFE7 (light cream)

---

## Animation Guidelines

- Smooth transitions: 200-300ms
- Easing: cubic-bezier(0.22, 1, 0.36, 1)
- Cassette flip: 600ms 3D rotation
- Track list reorder: Spring physics
- Hover states: Subtle scale + shadow
- Modal/menu appearances: Fade + slide

---

## Implementation Priority

1. **Page 1 (Set the Mood)**: Relationship + color selection
2. **Page 2 (Name the Tape)**: Form with validation
3. **Page 3 (Edit Tape)**: Cassette player interface with tracks
4. **Mobile Optimization**: Test and refine responsive behavior
5. **Animations**: Add polish with transitions
6. **Accessibility**: Audit and fix WCAG compliance
