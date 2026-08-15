# Cassette UI/UX Implementation Strategy
## Based on Reference Mockup + Master Design System

**Document Version:** 3.0 — Complete Implementation Strategy  
**Date:** August 2026  
**Status:** Ready for Development Sprint

---

## EXECUTIVE SUMMARY

The reference mockup demonstrates a mature, cohesive design system that successfully balances:
- **Nostalgic physicality** (realistic cassette aesthetics)
- **Modern UX polish** (clean information architecture, accessibility)
- **Emotional storytelling** (handwritten labels, personal notes)
- **Functional clarity** (intuitive navigation, clear CTAs)

This document provides a complete implementation roadmap to translate the mockup into production code while maintaining design consistency across all pages and interactions.

---

# PART 1: DESIGN SYSTEM FOUNDATIONS

## 1.1 Color Architecture

### Primary Palette (UI Foundation)
```
Background:    #FBFAF7  (Paper - warm cream)
Surface:       #FFFFFF  (Clean white)
Secondary:     #F3EFE7  (Soft cream - sections)
Ink:           #1D1D1F  (Primary text - dark)
Soft Ink:      #5F6065  (Secondary text)
Muted:         #8E8E93  (Tertiary text)
Hairline:      #D9D7D1  (Subtle borders)
```

### Accent Palette (Emotional Colors)
```
Coral:         #FF6B5E  (Primary CTA)
Strawberry:    #FF375F  (Alerts, emphasis)
Sunshine:      #FFCC00  (Joy, highlights)
Sky:           #5AC8FA  (Calm, secondary CTA)
Blue:          #007AFF  (Digital, trust)
Mint:          #34C759  (Success, confirmations)
Lavender:      #AF52DE  (Special, premium)
Peach:         #FF9F0A  (Warmth, secondary)
```

### Tape Accent Colors (User Selection)
```
Cream      #F5F0E8
Cherry     #C41E3A
Peach      #F4A259
Butter     #FFD93D
Sky        #6DB3F2
Pool       #2BA1D0
Lavender   #A78BFA
Mint       #86EFAC
Transparent #D4D4D8
Smoky      #6B7280
```

**Rule:** Only the cassette object uses vibrant accent colors. The UI remains neutral (cream/white) to avoid visual chaos.

---

## 1.2 Typography System

### Font Stack

**Display/Emotional (Headers, Labels)**
```css
font-family: "Fraunces", "DM Serif Display", "Instrument Serif", serif;
```
Usage: Page titles, tape labels, emotional copy, hero text

**UI/Body (Interface, Content)**
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", 
             "SF Pro Text", Inter, system-ui, sans-serif;
```
Usage: Body text, buttons, navigation, form labels

### Size Scale
```
Hero:           clamp(52px, 9vw, 128px)    [Primary page title]
Title L:        64px                        [Section heading]
Title M:        40px                        [Card/modal title]
Title S:        28px                        [Subsection]
Body Large:     18px                        [Main content]
Body:           16px                        [Standard copy]
Body Small:     14px                        [Secondary info]
Label:          12px                        [Metadata, small caps]
Tape Label:     14–16px                     [Cassette typography]
```

### Weight Distribution
```
Display: 400, 600 (vary for emphasis)
Body:    400 (regular), 500 (emphasis), 600 (strong)
```

---

## 1.3 Spacing System

**Base Unit:** 4px

**Scale:**
```
4px    (micro spacing)
8px    (compact)
12px   (small)
16px   (standard)
24px   (comfortable)
32px   (spacious)
40px   (breathing room)
48px   (major sections)
64px   (major breaks)
80px   (full separation)
96px   (major layout)
128px  (hero sections)
```

**Application Rule:**
- Horizontal padding: 16–24px (mobile), 32–48px (desktop)
- Vertical spacing: Use multiples of 16px for consistency
- Cards: 24px internal padding minimum
- Between sections: 48–64px minimum

---

## 1.4 Radius System

```
Small:    10px   (buttons, small UI elements)
Medium:   16px   (cards, containers)
Large:    24px   (modals, major containers)
XL:       32px   (hero sections, large cards)
Full:     50%    (circles only - player buttons, icons)
```

**Cassette Object Rule:**
Don't use pill-shaped cassettes. Match real cassette geometry:
- Top corners: 16–20px
- Bottom corners: 24px (slightly more rounded)
- Creates subtle physical authenticity

---

## 1.5 Shadow System

### Soft Object
```css
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
```
Usage: Cards, small UI elements, hover states

### Raised Cassette
```css
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.14);
```
Usage: Cassette on shelf, focus states, player deck

### Pressed/Active
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```
Usage: Buttons pressed, active states

### Subtle Depth
```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
```
Usage: Subtle elevation, metadata containers

---

## 1.6 Texture Guidelines

### Allowed Textures
- **Paper grain**: Very subtle (1–3% opacity on paper elements)
- **Subtle dust**: Minimal noise on cassette background
- **Light scratches**: Only on cassette object (not text)
- **Label texture**: Slight matte finish on tape labels

### Texture Rules (Critical)
✓ Textures should be emotionally perceived, not technically noticed
✗ Do NOT grain every surface
✗ Do NOT use heavy VHS distortion
✗ Do NOT add scanlines to UI
✗ Do NOT reduce text readability for aesthetics

**Implementation:** Use single PNG/SVG overlay at 1–2% opacity on cassette element only.

---

# PART 2: COMPONENT LIBRARY

## 2.1 Button System

### Primary Button (Coral)
```css
Background:    #FF6B5E
Text:          #FFFFFF
Padding:       12px 24px (mobile: 16px 32px)
Border Radius: 10px
Font:          16px, weight 600
Min Height:    44px (accessibility)
Transition:    200ms cubic-bezier(0.22, 1, 0.36, 1)

Hover:
  Background:  #FF5247
  Shadow:      0 8px 30px rgba(255, 107, 94, 0.25)
  Transform:   translateY(-2px)

Active:
  Background:  #E8543F
  Shadow:      0 4px 12px rgba(255, 107, 94, 0.15)
  Transform:   translateY(0)

Disabled:
  Background:  #E8E5DF
  Text:        #D9D7D1
  Cursor:      not-allowed
```

### Secondary Button (Sky/Light)
```css
Background:    #F3EFE7
Text:          #1D1D1F
Border:        1px solid #D9D7D1

Hover:
  Background:  #ECECDE
  Box-shadow:  0 8px 30px rgba(0, 0, 0, 0.08)

Active:
  Background:  #E8E5DF
```

### Tertiary Button (Text Only)
```css
Background:    transparent
Text:          #FF6B5E
Underline:     None (appears on hover)

Hover:
  Text:        #E8543F
  Underline:   1px solid #E8543F
```

### Cassette/Physical Button (Special)
```css
Background:    Gradient #1D1D1F → #3A3028
Text:          #FFFFFF
Border:        1px solid #5F6065
Radius:        12px
Effect:        Subtle beveled/3D appearance
Shadow:        0 4px 12px rgba(0, 0, 0, 0.2)

Hover:
  Brightness:  1.05
  Shadow:      0 6px 16px rgba(0, 0, 0, 0.25)

Active:
  Brightness:  0.95
  Shadow:      0 2px 8px rgba(0, 0, 0, 0.15)
```

---

## 2.2 Form Input System

### Text Input
```css
Width:         100% (block)
Height:        44px (min)
Padding:       12px 16px
Background:    #F3EFE7
Border:        1px solid #E8E5DF
Border Radius: 10px
Font:          16px, #1D1D1F
Placeholder:   #8E8E93

Focus:
  Border:      2px solid #FF6B5E
  Background:  #FFFFFF
  Box-shadow:  0 0 0 3px rgba(255, 107, 94, 0.1)
  Outline:     none

Error:
  Border:      2px solid #FF375F
  Box-shadow:  0 0 0 3px rgba(255, 55, 95, 0.1)
```

### Textarea (Notes)
```css
Extends text input but:
  Min-height:  120px
  Resize:      Vertical only
  Font:        16px (prevent zoom on iOS)
```

### Select Dropdown
```css
Appearance:    Custom (no browser default)
Background:    #F3EFE7
Icon:          Chevron, positioned right 12px
Font:          16px
```

### Relationship/Color Selection Cards
```css
Width:         120px (mobile), 140px (desktop)
Aspect Ratio:  1/1
Padding:       16px
Background:    #FFFFFF
Border:        2px solid transparent
Border Radius: 16px
Shadow:        0 8px 30px rgba(0, 0, 0, 0.08)
Transition:    200ms

Hover:
  Transform:   scale(1.02)
  Shadow:      0 12px 40px rgba(0, 0, 0, 0.12)

Selected:
  Border:      2px solid #FF6B5E
  Background:  rgba(255, 107, 94, 0.05)
```

---

## 2.3 Cassette Component

### Structure
```
┌─────────────────────────────────┐
│ POSITION COUNTER (90)  [optional]│
├─────────────────────────────────┤
│                                 │
│     ┌───────────────────────┐   │
│     │                       │   │
│     │    CASSETTE IMAGE     │   │
│     │    (realistic 3D)     │   │
│     │                       │   │
│     └───────────────────────┘   │
│                                 │
│   [◀◀] [▶ / ❚❚] [■] [▶▶]       │
│                                 │
│   00:42 / 04:16                 │
│                                 │
└─────────────────────────────────┘
```

### Cassette Image Properties
```css
Width:         280–320px (mobile), 350–400px (desktop)
Aspect Ratio:  1.3/1 (realistic cassette ratio)
Object Fit:    contain
Filter:        drop-shadow(0 20px 60px rgba(0, 0, 0, 0.14))
Transition:    300ms cubic-bezier(0.22, 1, 0.36, 1)

Hover/Focus:
  Transform:   translateY(-4px) scale(1.01)
  Filter:      drop-shadow(0 24px 70px rgba(0, 0, 0, 0.18))
```

### Cassette Label Display
```css
Label Area:    Centered on cassette front
Font:          14–16px, serif (display font)
Color:         #1D1D1F on light tape, #FFFFFF on dark
Text Align:    Center
Max Width:     90% of cassette
Line Height:   1.4

Content Format:
  LINE 1:      "SIDE A" or "SIDE B" (small caps)
  LINE 2:      Tape Title (emphasis)
  LINE 3:      "FOR [Recipient]" (smaller)
  LINE 4:      "FROM [Sender]" (smallest)
```

### Player Controls Below Cassette
```css
Display:       Flex, justify-content: center
Gap:           24px
Button Size:   44–48px diameter
Icons:         Material Symbols or Feather Icons (consistent weight)

Layout (mobile): [◀◀] [▶] [■] [▶▶]
Layout (desktop): [◀◀] [◀] [▶ / ❚❚] [■] [▶▶]
```

---

## 2.4 Track List Component

### Container
```css
Background:    #FFFFFF
Padding:       24px
Border Radius: 16px
Shadow:        0 8px 30px rgba(0, 0, 0, 0.08)
Max Height:    600px (desktop), full (mobile)
Overflow Y:    auto (smooth scrolling)
```

### Track Item
```css
Padding:       16px
Border Bottom: 1px solid #E8E5DF (between items)
Display:       Grid
Grid Columns:  auto 1fr auto auto
Gap:           16px
Align Items:   center

Hover:
  Background:  #F9F8F5
  Transform:   none (avoid shift)

Active/Playing:
  Background:  rgba(255, 107, 94, 0.05)
  Border Left: 3px solid #FF6B5E
```

### Track Info
```
[#] Song Title                              [3:45] [⋮]
    Artist Name                             [edit] [×]
    
    Optional note (if exists):
    "This reminds me of..."
    [styled in light background]
```

### Track Number
```css
Width:         24px
Text Align:    center
Font:          12px bold
Color:         #8E8E93
```

### Track Title
```css
Font:          16px, weight 600
Color:         #1D1D1F
Margin Bottom: 4px
```

### Track Artist
```css
Font:          14px
Color:         #5F6065
```

### Track Duration
```css
Font:          12px
Color:         #8E8E93
Text Align:    right
Width:         auto
Min Width:     32px
```

### Action Icons (Appear on Hover)
```css
Display:       none (desktop), visible (hover only)
Display:       flex (mobile, always visible)
Gap:           8px

Edit Icon:     #5F6065, 18px, hover → #FF6B5E
Delete Icon:   #C41E3A, 18px, hover → #8B0000
```

### Track Note (Optional)
```css
Grid Column:   1 / -1 (full width)
Background:    rgba(255, 107, 94, 0.08)
Padding:       12px 16px
Border Radius: 8px
Font:          14px italic
Color:         #5F6065
Margin Top:    8px
```

---

## 2.5 Side Selector

### Tab Style (Don't Use)
✗ Avoid browser-style tabs or generic tab UX

### Physical Flip Metaphor (Do Use)
```css
Container:     Flex, gap 12px
Style:         Two buttons side-by-side

Button:
  Width:       100px
  Height:      36px
  Background:  Inactive: #F3EFE7, Active: #FF6B5E
  Text:        "SIDE A" / "SIDE B" (small caps)
  Border:      2px solid transparent (active: none)
  Transition:  200ms

Active State:
  Background:  #FF6B5E
  Text Color:  #FFFFFF
  Shadow:      0 8px 30px rgba(255, 107, 94, 0.25)
```

### Animation on Switch
```
Current view:      SIDE A tracks
User clicks:       SIDE B button
Animation:
  1. Tracks fade out (100ms)
  2. Cassette rotates 180° (300ms)
  3. New tracks fade in (100ms)
```

---

## 2.6 Modal/Sheet Component

### Desktop Modal
```css
Position:      fixed
Top:           50%
Left:          50%
Transform:     translate(-50%, -50%)
Width:         90vw
Max Width:     600px
Background:    #FFFFFF
Border Radius: 24px
Shadow:        0 25px 50px rgba(0, 0, 0, 0.15)
Padding:       40px
Z-Index:       1000

Backdrop:
  Background:  rgba(0, 0, 0, 0.3)
  Backdrop-Filter: blur(4px)
```

### Mobile Sheet
```css
Position:      fixed
Bottom:        0
Left:          0
Right:         0
Background:    #FFFFFF
Border Radius: 24px (top only)
Padding:       24px
Max Height:    80vh
Overflow Y:    auto
Z-Index:       1000

Animation:
  Enter:       slide-up 300ms cubic-bezier(0.22, 1, 0.36, 1)
  Exit:        slide-down 200ms cubic-bezier(0.22, 1, 0.36, 1)
```

---

# PART 3: PAGE LAYOUTS

## 3.1 Homepage / Shelf View

### Hero Section
```
┌────────────────────────────────────────────┐
│                                            │
│  CASSETTE    [Navigation]     [Open Tape]  │
│                                            │
│  Put your feelings                         │
│  on tape.                                  │
│                                            │
│  Little digital mixtapes made by           │
│  people for people.                        │
│                                            │
│  [Make a Tape] [Browse Public]             │
│                                            │
└────────────────────────────────────────────┘
```

**Layout Details:**
- Max-width: 1200px centered
- Padding: 48px (desktop), 32px (tablet), 24px (mobile)
- Hero text alignment: Left-aligned (not centered)
- CTA buttons: Side-by-side (desktop), stacked (mobile)

### Shelf Section
```
┌────────────────────────────────────────────┐
│  THE TAPE SHELF                            │
│  Browse public tapes from the community.   │
│                                            │
│   [Filter by mood:]                        │
│   For Love | Best Friend | Family |        │
│   Memories | For Me | Just Because         │
│                                            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ 📼  │ │ 📼  │ │ 📼  │ │ 📼  │          │
│  │red  │ │cream│ │blue │ │clear│          │
│  ├─────┤ ├─────┤ ├─────┤ ├─────┤          │
│  │Tape │ │Tape │ │Tape │ │Tape │          │
│  │Name │ │Name │ │Name │ │Name │          │
│  │by X │ │by Y │ │by Z │ │by W │          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
│                                            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
│                                            │
└────────────────────────────────────────────┘
```

**Cassette Card:**
- Width: 140px (mobile), 160px (desktop)
- Include rotation effect (2–4° variation per card)
- Show cassette color prominently
- Tape metadata below: "Summer '26 • for Riya • by Akki"
- Hover: Lift 8px, increase shadow
- Click: Open player view

**Filter Buttons:**
- Display: Horizontal scroll (mobile), wrap (desktop)
- Style: Secondary button system
- Selected: Active coral border + background

---

## 3.2 Create Flow — Page 1: "Set the Mood"

```
┌────────────────────────────────────────────┐
│ CASSETTE    [Back]    Step 1 of 3          │
├────────────────────────────────────────────┤
│                                            │
│  WHO IS THIS TAPE FOR?                     │
│                                            │
│  Set the mood.                             │
│                                            │
│  Relationship Selection (2x3 grid):        │
│  ┌──────────┐ ┌──────────┐                │
│  │ ❤️  For  │ │ 👫 Best  │                │
│  │My Love   │ │Friend    │                │
│  └──────────┘ └──────────┘                │
│  ┌──────────┐ ┌──────────┐                │
│  │ 👨‍👩‍👧 Family│ │ 🎭 A     │                │
│  │          │ │Memory    │                │
│  └──────────┘ └──────────┘                │
│  ┌──────────┐ ┌──────────┐                │
│  │ 😊 Just  │ │ 🎁 Just  │                │
│  │for Me    │ │Because   │                │
│  └──────────┘ └──────────┘                │
│                                            │
│  COLOR SELECTION:                          │
│  [●] [●] [●] [●] [●] [●] [●] [●] [●]     │
│  Cream Cherr Peach Butte Sky  Pool Laven…│
│                                            │
│                    [Next →]                │
│                                            │
└────────────────────────────────────────────┘
```

**Desktop Layout:**
- Center column (max 600px)
- Relationship cards: 2 columns
- Color palette: Horizontal scrollable or wrapping grid
- Responsive: Stack on mobile

**Interactions:**
- Select relationship: Border highlight, background tint
- Select color: Dark border, glow effect
- Next button: Full width, primary style
- Draft auto-save: "Saving..." → "Saved" indicator

---

## 3.3 Create Flow — Page 2: "Name the Tape"

```
┌────────────────────────────────────────────┐
│ CASSETTE    [Back]    Step 2 of 3          │
├────────────────────────────────────────────┤
│                                            │
│  Name the tape.                            │
│  You can always change these later.        │
│                                            │
│      [Cassette Color Badge: 80px]          │
│                                            │
│  YOUR NAME *                               │
│  [____________________________]             │
│                                            │
│  RECIPIENT'S NAME *                        │
│  [____________________________]             │
│                                            │
│  TAPE TITLE (OPTIONAL)                     │
│  [____________________________]             │
│                                            │
│  DEDICATION (OPTIONAL)                     │
│  [                                      ]  │
│  [                                      ]  │
│  [____________________________]             │
│                                            │
│            [Start Adding Songs →]          │
│                                            │
└────────────────────────────────────────────┘
```

**Form Behavior:**
- All fields: 44px min height
- Focus: Orange border + subtle glow
- Validation: Real-time on blur
- Error messages: #FF375F, appear below field
- Placeholder text: Helpful, example-based ("e.g., Late Night Drive Vol. 1")
- Tape badge: Show selected color in circular preview

---

## 3.4 Create Flow — Page 3: "Edit Tape"

### Desktop Layout (Recommended)
```
┌────────────────────────────────────────────────────────────────┐
│ CASSETTE    [Back]    Step 3 of 3   Save Draft                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [LEFT PANEL - PLAYER]          [RIGHT PANEL - TRACK LIST]   │
│                                                                │
│  POSITION 90        TIME 1:11   ┌──────────────────────────┐  │
│                                 │ SIDE A   6 tracks • 28:46 │  │
│  ┌──────────────────┐           │                          │  │
│  │  CASSETTE        │           │ 1. Song Title     [3:45] │  │
│  │  [INSERT TAPE]   │           │    Artist                │  │
│  │  90              │           │                          │  │
│  │  SUMMER '26      │           │ 2. Song Title     [4:12] │  │
│  │  FOR RIYA        │           │    Artist                │  │
│  │  FROM AKKI       │           │    Note: "Why..."        │  │
│  │                  │           │                          │  │
│  └──────────────────┘           │ 3. Song Title     [3:31] │  │
│                                 │    Artist                │  │
│  [◀◀] [▶] [■] [▶▶] [VOL]       │                          │  │
│  ─────────────────────────      │ [+ Add Song]             │  │
│  00:42 / 04:16                  │                          │  │
│                                 │ SIDE B                   │  │
│  [Menu: Tracks | Design |       │                          │  │
│  Label | Message | Preview]     └──────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Stacked)
```
┌──────────────────────────────┐
│ CASSETTE [Back] Step 3 of 3  │
├──────────────────────────────┤
│                              │
│  [Position Counter: 90]      │
│                              │
│  ┌──────────────────────┐    │
│  │   CASSETTE PLAYER    │    │
│  │   [FULL WIDTH]       │    │
│  │   ┌──────────────┐   │    │
│  │   │  CASSETTE    │   │    │
│  │   │              │   │    │
│  │   │  90          │   │    │
│  │   │  SUMMER '26  │   │    │
│  │   │  FOR RIYA    │   │    │
│  │   │              │   │    │
│  │   └──────────────┘   │    │
│  │                      │    │
│  │  Controls            │    │
│  │  Time Display        │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │ SIDE A              │    │
│  │ 6 tracks • 28:46    │    │
│  │                      │    │
│  │ 1. Song Title [3:45]│    │
│  │    Artist            │    │
│  │                      │    │
│  │ 2. Song Title [4:12]│    │
│  │    Artist            │    │
│  │    Note: "Why..."    │    │
│  │                      │    │
│  │ [+ Add Song]        │    │
│  │                      │    │
│  │ [SIDE B]            │    │
│  └──────────────────────┘    │
│                              │
│  [Menu: Tracks | Design...]  │
│                              │
└──────────────────────────────┘
```

**Left Panel (Player):**
- Cassette image: 300–350px width
- Position counter: Small, top-left (optional)
- Player controls: Centered below
- Menu options: Vertical list or icon buttons

**Right Panel (Track List):**
- Background: White container
- Max height: 600px, scrollable
- Each track: Full-width card style
- Hover actions: Edit note, delete track

---

## 3.5 Tape View / Player Page

### Entry State
```
┌────────────────────────────────────────────┐
│                                            │
│  ← Back    PLAY     Share  [Share icon]    │
│                                            │
│                                            │
│   SUMMER '26                               │
│                                            │
│   FOR RIYA                                 │
│                                            │
│                                            │
│   ┌──────────────────────┐                │
│   │   CASSETTE PLAYER    │                │
│   │   [REALISTIC IMAGE]  │                │
│   │                      │                │
│   │   ┌──────────────┐   │                │
│   │   │              │   │                │
│   │   │  SIDE A      │   │                │
│   │   │  SUMMER '26  │   │                │
│   │   │  FOR RIYA    │   │                │
│   │   │              │   │                │
│   │   └──────────────┘   │                │
│   │                      │                │
│   │   [INSERT TAPE]      │                │
│   └──────────────────────┘                │
│                                            │
│                                            │
│   Someone made this for you.               │
│                                            │
└────────────────────────────────────────────┘
```

### Playing State
```
┌────────────────────────────────────────────┐
│  ← Back    PLAYING     Share               │
│                                            │
│  Track 01 / 3 (SIDE A)                     │
│                                            │
│  Song Title                                │
│  Artist Name                               │
│                                            │
│  ┌──────────────────────┐                │
│  │   CASSETTE PLAYER    │                │
│  │   [REALISTIC IMAGE]  │                │
│  │   With spinning reels│                │
│  │   and moving tape    │                │
│  └──────────────────────┘                │
│                                            │
│  [◀◀] [▶ / ❚❚] [■] [▶▶]                  │
│  ─────────────────────────────            │
│  01:24 / 03:45                            │
│                                            │
│  "This reminds me of that night..."       │
│  (Personal note if exists)                │
│                                            │
│  Made by Akki                             │
│                                            │
└────────────────────────────────────────────┘
```

---

## 3.6 Share & Send Experience

### After Recording
```
┌────────────────────────────────────────────┐
│                                            │
│  ✓  YOUR TAPE IS READY                     │
│                                            │
│          SUMMER '26                        │
│                                            │
│     [Cassette in case]                    │
│                                            │
│     FOR RIYA                               │
│                                            │
│     MADE BY AKKI                           │
│                                            │
│  ┌──────────────────────┐                │
│  │ SEND IT TO THEM ❤️   │  (Primary)    │
│  └──────────────────────┘                │
│                                            │
│  ┌──────────────────────┐                │
│  │ COPY LINK            │  (Secondary)   │
│  └──────────────────────┘                │
│                                            │
│  ┌──────────────────────┐                │
│  │ LISTEN AGAIN         │  (Tertiary)    │
│  └──────────────────────┘                │
│                                            │
└────────────────────────────────────────────┘
```

**Share Modal:**
```
┌──────────────────────────────────┐
│  Share Your Tape                 │
│  ─────────────────────────────── │
│                                  │
│  LINK:                           │
│  [cassette.fm/tape/abc123]  [📋] │
│                                  │
│  OR SHARE WITH:                  │
│  [WhatsApp] [Telegram]           │
│  [Email]    [Messenger]          │
│  [Twitter]  [Instagram]          │
│                                  │
│            [Done]                │
│                                  │
└──────────────────────────────────┘
```

---

# PART 4: INTERACTION & ANIMATION SPECIFICATIONS

## 4.1 Micro-Interactions

### Button Interactions
```
Hover:
  Duration:      200ms
  Easing:        cubic-bezier(0.22, 1, 0.36, 1)
  Transform:     translateY(-2px)
  Shadow:        Increase by 1 level

Active:
  Duration:      100ms
  Transform:     translateY(0)
  Shadow:        Decrease by 1 level

Focus (Keyboard):
  Outline:       2px solid #FF6B5E
  Outline-offset: 4px
```

### Cassette Interaction
```
Hover (Shelf):
  Duration:      300ms
  Transform:     translateY(-8px) rotate(1deg)
  Shadow:        0 24px 70px rgba(0, 0, 0, 0.18)

Click (Shelf → Player):
  1. Cassette lifts (200ms)
  2. Fade out shelf (150ms)
  3. Fade in player (200ms)
  4. Optional: Sound effect (quiet mechanical click)

Focus (Player):
  Transform:     scale(1.01)
  Shadow:        Increase subtly
  Outline:       None (relies on color change)
```

### Track Interaction
```
Hover (Track in list):
  Background:    #F9F8F5
  Duration:      150ms
  Action icons:  Fade in (opacity 0 → 1)

Click (Select track):
  Background:    rgba(255, 107, 94, 0.05)
  Border-left:   3px solid #FF6B5E
  Duration:      200ms

Delete on hover:
  Icon appears:  Linear fade-in, 100ms
  Icon hover:    Color #C41E3A, scale 1.1
  Confirm modal: Appear 200ms delay
```

---

## 4.2 Major Animations

### Cassette Insertion
```
Sequence:
  1. Cassette at rest position (0ms)
  2. Lift up 12px, rotate slight right (100ms)
  3. Move toward slot (200ms)
  4. Rotate into straight (150ms)
  5. Slide into deck (250ms)
  6. Slot closes (100ms, subtle)
  7. Reels start (100ms, immediate)
  8. Tape begins playing (smooth fade-in)

Total: 900ms approx
Sound: Optional quiet mechanical sounds
Easing: Use cubic-bezier(0.22, 1, 0.36, 1) throughout
```

### Tape Flip Animation
```
Sequence (User selects SIDE B):
  1. Play stops (100ms)
  2. Tracks list fades out (100ms)
  3. Cassette rotates 180° in Y-axis (400ms)
  4. Label switches (simultaneous with rotation)
  5. Cassette settles (100ms deceleration)
  6. New tracks list fades in (150ms)
  7. Ready to play SIDE B

Total: 750ms approx
3D: Use perspective(800px) for convincing 3D rotation
Easing: cubic-bezier(0.22, 1, 0.36, 1) for smooth physics
```

### Reel Rotation (Playing)
```
Left Reel:
  Speed: 1 rotation per 6 seconds (at normal playback)
  Easing: linear (constant rotation)
  At pause: Decelerate smoothly over 300ms to stop
  At play: Accelerate smoothly over 200ms to playback speed

Right Reel:
  Same as left reel (both rotate in same direction for visual interest)

Rewind/Fast-forward:
  Speed: Increase by 2–3x normal during hold
  When released: Decelerate back to playback speed or stop
```

### Side Transition Animation
```
When user switches from SIDE A to SIDE B:
  1. Reels slow down (100ms)
  2. Cassette rotates (300ms)
  3. UI elements transition (crossfade, 150ms)
  4. Position resets (0:00)

All motion should feel mechanical, not digital.
```

---

## 4.3 Loading States

### Skeleton Loading
```
When tracks are loading:
  Show placeholder cards with pulse animation
  
Pulse:
  Opacity: 1 → 0.6 → 1
  Duration: 2000ms
  Easing: ease-in-out
  Color: #E8E5DF

Keep skeleton aspect ratio matching real tracks.
```

### Tape Recording Simulation
```
When user clicks "RECORD TAPE":
  
  Phase 1 (0–200ms):
    Cassette moves into deck
    Text: "INSERTING BLANK TAPE..."
  
  Phase 2 (200–400ms):
    Deck closes with subtle click sound
    REC light illuminates (#FF375F)
  
  Phase 3 (400ms–completion):
    Reels start rotating
    Progress bar advances smoothly
    Track info displays current recording progress
    Show "RECORDING SIDE A" → "SIDE A COMPLETE" → "FLIP TAPE"
  
  Phase 4 (Flip):
    Tape rotates 180°
    "RECORDING SIDE B" begins
  
  Phase 5 (Complete):
    Reels decelerate
    Tape auto-rewinds smoothly
    Final message: "Your tape is ready!"
    
  Sound effects (optional):
    - Quiet mechanical tape movement
    - Reel start/stop subtle clicks
    - Deck close click
    - Completion chime (very subtle, optional)
```

---

## 4.4 Gestures (Mobile)

### Swipe to Flip
```
On Tape View (vertical swipe):
  Swipe Up:       Advance to next track
  Swipe Down:     Go to previous track
  Swipe Left:     Fast-forward (hold to keep advancing)
  Swipe Right:    Rewind (hold to keep going back)

On Edit Page (horizontal drag):
  Drag Left/Right: Rotate cassette in 3D
  Release:        Snap to SIDE A or SIDE B

Threshold: 40px minimum swipe distance
Velocity: Use momentum-based scrolling for fling gestures
```

### Tap Gestures
```
Tap cassette:     Play/Pause toggle
Double-tap:       Open track list (modal on mobile)
Long-press:       Show options menu (edit, delete, etc.)
```

---

# PART 5: RESPONSIVE DESIGN

## 5.1 Breakpoints

```
Mobile:    < 640px
Tablet:    640px – 1024px
Desktop:   > 1024px
```

### Mobile Optimizations
- Full-width layouts (no sidebars initially)
- Stack all major sections vertically
- Increase touch targets to 44–48px minimum
- Simplify navigation (hamburger menu or bottom nav)
- Cassette player: Full width, centered
- Track list: Horizontal scroll or modal
- Forms: Full-width inputs, large touch targets

### Tablet Adjustments
- Two-column layouts where appropriate
- Player on left, tracks on right (if space allows)
- Moderate padding/spacing
- Navigation can be horizontal

### Desktop Features
- Three-column layouts possible
- Side panels for metadata
- Keyboard shortcuts (Arrow keys, Space, etc.)
- Hover states fully utilized

---

## 5.2 Touch-Friendly Design

```css
Minimum touch targets:     44px × 44px
Minimum padding between:   8px
Tap feedback:              Visual + haptic (if supported)

Modal on mobile:
  Bottom sheet preferred over center modal
  Can be dismissed by swipe-down
  Full viewport height when needed
```

---

## 5.3 Accessibility

### Color Contrast
```
Text on background:     Minimum 4.5:1 (WCAG AA)
Graphics:               Minimum 3:1 (WCAG AA)

Primary text:           #1D1D1F on #FBFAF7 = 14.8:1 ✓
Secondary text:         #5F6065 on #FBFAF7 = 7.2:1 ✓
Button text:            #FFFFFF on #FF6B5E = 6.3:1 ✓
```

### Labels & Form
```
Every input must have:
  - Associated <label> element
  - Visible label text
  - Error messages connected via aria-describedby
  - Focus indicator (outline: 2px solid #FF6B5E)

Placeholder is NOT a label.
```

### Navigation
```
Skip link: Available at top of page
Keyboard navigation: Tab order must be logical
Focus indicators: Always visible, sufficient size
Semantic HTML: Use <button>, <nav>, <main>, <article>
```

### Media
```
Cassette animations: Respect prefers-reduced-motion
  - Disable 3D rotations if motion is reduced
  - Keep functional elements instant
  - Provide text alternatives for visual states

Audio: Provide transcripts for important content
  - Track notes displayed as text
  - Don't rely on audio alone for critical info
```

---

# PART 6: IMPLEMENTATION CHECKLIST

## Phase 1: Design System
- [ ] Define CSS variables for all colors
- [ ] Implement typography scale
- [ ] Create spacing system (CSS grid or margin scale)
- [ ] Set up button component variants
- [ ] Create form input components
- [ ] Build cassette component with SVG/canvas

## Phase 2: Core Pages
- [ ] Homepage with shelf layout
- [ ] Create flow (3-page form with state management)
- [ ] Edit tape page (cassette player + track list)
- [ ] Tape view / player page

## Phase 3: Interactions
- [ ] Hover states on all interactive elements
- [ ] Cassette insertion animation
- [ ] Tape flip animation
- [ ] Reel rotation during playback
- [ ] Track selection feedback

## Phase 4: Mobile & Responsiveness
- [ ] Test all pages at 375px (mobile)
- [ ] Test at 768px (tablet)
- [ ] Test at 1280px (desktop)
- [ ] Optimize touch targets
- [ ] Implement mobile-specific layouts

## Phase 5: Accessibility
- [ ] Run axe DevTools audit
- [ ] Test keyboard navigation
- [ ] Verify color contrast
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Validate HTML semantics
- [ ] Test prefers-reduced-motion

## Phase 6: Performance
- [ ] Optimize cassette images (SVG + lazy load)
- [ ] Minimize animation frame drops
- [ ] Lazy-load track lists
- [ ] Optimize bundle size
- [ ] Test Lighthouse scores

---

# PART 7: COMMON PATTERNS

## Pattern: Confirmation Delete
```
User clicks delete on track:
  1. Icon highlights (#C41E3A)
  2. Modal appears: "Delete track?"
  3. Two buttons: [Cancel] [Delete]
  4. On confirm: Track slides out (150ms), list reorganizes (200ms)
  5. Undo toast appears (3 seconds)
```

## Pattern: Unsaved Changes
```
User navigates away with unsaved edits:
  1. Modal: "You have unsaved changes. Save before leaving?"
  2. Options: [Save] [Discard] [Keep Editing]
  3. Save: Upload → "Saved" toast → Navigate
  4. Discard: Immediate navigation
  5. Keep: Close modal, stay on page
```

## Pattern: Empty States
```
Show helpful empty state when:
  - No tracks added yet
  - Search returns no results
  - Shelf has no public tapes

Content:
  - Icon or illustration (not just text)
  - Friendly message ("Start by adding a song...")
  - Call to action button
  - Optional: Animated suggestion
```

---

# PART 8: FUTURE ENHANCEMENTS

## Premium Features (Post-MVP)
- Custom cassette artwork upload
- Animated gift wrapping / envelope opening
- Sound effect customization
- Physical cassette printing
- QR code on J-card (links to digital)
- Custom typography for labels
- Photo collage on J-card
- Collaborative playlists

## Community Features
- Follow creators
- Comment/reactions on public tapes
- Remix / cover tapes
- Trending shelf categories
- User profiles with tape collections

## Personalization
- Dark mode toggle
- Custom color palettes
- Language localization
- Theme customization

---

# APPENDIX: CSS UTILITY CLASSES

## Shadow Utilities
```css
.shadow-soft-object {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.shadow-raised-cassette {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.14);
}

.shadow-pressed {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.shadow-subtle {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
```

## Transition Utilities
```css
.transition-smooth {
  transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.transition-bounce {
  transition: all 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.transition-instant {
  transition: all 100ms ease-out;
}
```

## Text Utilities
```css
.text-hero {
  font-size: clamp(52px, 9vw, 128px);
  font-family: "Fraunces", serif;
  font-weight: 600;
}

.text-title-l {
  font-size: 64px;
  font-family: "Fraunces", serif;
  font-weight: 400;
}

.text-body {
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
}

.text-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

## Spacing Utilities
```css
.p-small { padding: 12px; }
.p-medium { padding: 16px; }
.p-large { padding: 24px; }
.p-xl { padding: 32px; }

.gap-xs { gap: 8px; }
.gap-sm { gap: 16px; }
.gap-md { gap: 24px; }
.gap-lg { gap: 32px; }
```

---

# CONCLUSION

This implementation strategy provides a complete roadmap for building a Cassette experience that balances nostalgic physicality with modern interface design. The design system ensures consistency across all pages while allowing for creative expression through cassette customization.

**Key Principles:**
1. Object-first design (cassette is the primary visual element)
2. Emotional storytelling through micro-interactions
3. Accessibility built-in, not added later
4. Mobile-first responsive approach
5. Performance optimization for smooth animations

**Success Metrics:**
- Users understand the product without explanation
- Cassette interactions feel tactile and real
- Tape creation feels ceremonial, not transactional
- Recipients feel the personal nature of the gift
- All interactions respond smoothly with < 100ms delay

---

**Document prepared for:** Cassette Development Team  
**Next step:** Begin Phase 1 (Design System implementation)
