# CASSETTE — UI/UX MASTER DESIGN SYSTEM

**Document:** End-to-End UI/UX Design Specification  
**Version:** 2.0 — Nostalgia / Physicality Direction  
**Status:** Master design direction for implementation  
**Product:** CASSETTE — digital mixtape / emotional music gift  
**Primary experience:** Mobile-first, desktop-enhanced  
**Design north star:** **Make the internet feel physical for a few minutes.**

---

## 0. EXECUTIVE DESIGN DECISION

The existing product definition is strong on **what CASSETTE does**, but the next design iteration must make the product feel substantially more physical.

The product should NOT feel like:

- a Spotify clone with a cassette skin
- a playlist builder with retro colors
- a generic Y2K landing page
- a SaaS dashboard
- a collection of decorative cassette images
- a nostalgia-themed web page where the nostalgia is only visual

It should feel like:

> **I found a little cassette object on the internet, picked it up, opened it, put the tape in, pressed play, and someone had left something inside it for me.**

The core design principle becomes:

# **Object first. Interface second.**

Every important action should have a physical metaphor:

| Digital action | Physical metaphor |
|---|---|
| Open tape | Pick up / open a cassette case |
| Insert | Push cassette into deck |
| Play | Press physical PLAY |
| Pause | Mechanical pause |
| Stop | Press STOP |
| Rewind | Tape reels pull tape backward |
| Fast-forward | Reels accelerate |
| Side A → B | Eject, flip, reinsert |
| Create | Write on a blank cassette |
| Add song | Put a song onto the tape |
| Add note | Write on the J-card / label |
| Record | Watch the tape being recorded |
| Send | Put the tape into an envelope |
| Receive | Open a little digital package |
| Make One Back | Start another blank tape |

The user should understand the product without reading an explanation.

---

# 1. PRODUCT FOUNDATION

The original PRD defines CASSETTE as:

> **A digital mixtape for people who mean something to you.**

The product is intentionally not a playlist manager. Its core loop is:

```text
CREATE
   ↓
PERSONALIZE
   ↓
RECORD
   ↓
SHARE
   ↓
RECIPIENT OPENS
   ↓
LISTENS / READS / EXPERIENCES
   ↓
MAKE ONE BACK
   ↓
NEW TAPE
```

The MVP must make this one thing magical:

> **I can make a tape for someone and send it to them.**

The design must therefore optimize for emotional completion, not feature density.

### North-star design test

A successful first-time user should be able to say:

> “This feels like a real cassette.”

A successful recipient should say:

> “Someone actually made this for me.”

The product should create the second reaction, not merely the first.

---

# 2. DESIGN NORTH STAR

## The feeling

Imagine:

- a cassette discovered in an old bedroom drawer
- a handwritten label
- slightly imperfect plastic
- tiny scratches
- paper texture
- a physical tape deck
- the click of a button
- reels slowly beginning to turn
- the feeling of waiting for a tape to start
- handwritten notes between songs
- a personal message that cannot be replaced by an algorithm

Now translate that into a modern web experience.

### Formula

```text
PHYSICAL NOSTALGIA
        +
MODERN APP QUALITY
        +
EMOTIONAL WRITING
        +
MICRO-INTERACTIONS
        =
CASSETTE
```

The nostalgic layer should never compromise usability.

---

# 3. DESIGN PERSONALITY

## Five words

**Warm. Tactile. Personal. Playful. Quietly magical.**

## Brand voice

Use:

- intimate language
- short sentences
- human language
- small moments of humor
- handwritten-feeling copy
- emotional but not overly sentimental language

Avoid:

- corporate SaaS language
- “AI-powered”
- “next-generation”
- “social music platform”
- growth-hacking language
- excessive emojis
- aggressive conversion copy
- fake retro slang

### Example

Bad:

> Create a personalized music playlist and share it with your friends.

Good:

> **Put your feelings on tape.**

Better interaction copy:

> **Someone made this for you.**

---

# 4. VISUAL DIRECTION

## 4.1 The visual target

The supplied references show three useful directions:

### Reference A — Real cassette photography

Use the Pinterest cassette references as inspiration for:

- real cassette proportions
- label placement
- plastic transparency
- reel geometry
- paper labels
- imperfect physical details
- color combinations

Do NOT simply paste Pinterest images into the UI.

Use them to build the visual language.

### Reference B — Mixtape websites

The supplied examples demonstrate:

- cassette-as-main-character interaction
- rack / shelf presentation
- personalized labels
- music gift framing
- cassette playback metaphors
- playful transitions

### Reference C — Cassettine

Cassettine demonstrates a simple gift funnel:

1. import playlist
2. customize tape
3. share mixtape

That simplicity is valuable.

CASSETTE should retain the simplicity while going much deeper into physical interaction.

---

# 5. COLOR SYSTEM

## Critical decision

Do **NOT** use the dark/green/neon sports-dashboard style from unrelated projects.

Do **NOT** make the product black + neon green.

Do **NOT** make the entire site beige/brown either.

The correct direction is:

> **Apple-like cleanliness + happy nostalgic colors + physical materials.**

The UI foundation should be calm and neutral.

The cassette itself can be colorful.

This distinction is extremely important.

---

## 5.1 Core UI palette

### Paper

`#FBFAF7`

Main background.

### Warm white

`#FFFFFF`

Cards, sheets, modal surfaces.

### Soft cream

`#F3EFE7`

Secondary sections.

### Ink

`#1D1D1F`

Primary text.

### Soft ink

`#5F6065`

Secondary text.

### Muted

`#8E8E93`

Tertiary text.

### Hairline

`#D9D7D1`

Subtle borders.

---

## 5.2 Happy accent palette

Use accents sparingly.

### Coral

`#FF6B5E`

### Strawberry

`#FF375F`

### Sunshine

`#FFCC00`

### Sky

`#5AC8FA`

### Blue

`#007AFF`

### Mint

`#34C759`

### Lavender

`#AF52DE`

### Peach

`#FF9F0A`

These are inspired by the emotional language of modern consumer interfaces rather than dark neon aesthetics.

---

## 5.3 Tape accent colors

Tape creators can select:

```text
Cream
Cherry
Peach
Butter
Sky
Pool
Lavender
Mint
Transparent
Smoky
```

The page itself remains neutral.

The tape owns the color.

This prevents visual chaos.

---

# 6. MATERIAL SYSTEM

The product has four physical materials.

## 6.1 Plastic

Used for:

- cassette shell
- buttons
- case
- transparent elements

Characteristics:

- subtle highlights
- very soft shadows
- restrained translucency
- tiny imperfections

Never use exaggerated glassmorphism.

---

## 6.2 Paper

Used for:

- labels
- J-cards
- notes
- envelopes
- track cards

Characteristics:

- warm white
- tiny grain
- imperfect edges
- subtle shadow

---

## 6.3 Ink

Used for:

- handwritten text
- labels
- track notes
- metadata

Typography should occasionally feel handwritten without making the entire application difficult to read.

---

## 6.4 Metal

Used very selectively for:

- tape deck buttons
- cassette player controls
- screws
- small hardware details

---

# 7. TYPOGRAPHY

Use only two primary font families.

## Display / emotional font

Use a friendly editorial or handwritten display face.

Possible direction:

- Fraunces
- DM Serif Display
- Instrument Serif
- a carefully chosen handwritten font for labels only

## UI font

Use a clean system-like font.

Recommended:

```text
-apple-system
BlinkMacSystemFont
"SF Pro Display"
"SF Pro Text"
Inter
system-ui
sans-serif
```

The interface should feel as refined as Apple.

---

## Typography hierarchy

### Hero

Large:

`clamp(52px, 9vw, 128px)`

Tight tracking.

### Section title

`40–64px`

### Card title

`20–28px`

### Body

`16–18px`

### Metadata

`12–14px`

### Tape label

Use a handwriting/display style.

The tape label is allowed to break normal UI typography rules.

---

# 8. SPACING

Use a 4px base with a strong 8px rhythm.

```text
4
8
12
16
24
32
40
48
64
80
96
128
```

Large whitespace is important.

The product should feel collected, not crowded.

---

# 9. RADIUS SYSTEM

Modern UI:

```text
Small: 10px
Medium: 16px
Large: 24px
XL: 32px
```

Physical cassette:

Use radius based on the actual object shape.

Do not make every object pill-shaped.

---

# 10. SHADOW SYSTEM

Shadows should feel like physical objects sitting on a surface.

### Soft object

```text
0 8px 30px rgba(0,0,0,.08)
```

### Raised cassette

```text
0 20px 60px rgba(0,0,0,.14)
```

### Pressed control

Reduce shadow rather than adding a glow.

Never use neon glow as a primary interaction signal.

---

# 11. TEXTURE RULES

Texture is important but dangerous.

Use:

- paper grain
- subtle dust
- very faint plastic noise
- tiny scratches
- halftone only in special scenes

Do not:

- put grain over every surface
- use heavy VHS distortion
- add scanlines everywhere
- make text fuzzy
- reduce readability for aesthetic reasons

### Rule

> **The user should notice the texture emotionally before noticing it technically.**

---

# 12. GLOBAL INFORMATION ARCHITECTURE

The public experience should have four major areas.

```text
CASSETTE
│
├── HOME
│   └── PUBLIC TAPE SHELF
│
├── MAKE
│   └── CREATE / RECORD / SEND
│
├── GIFTS
│   └── PREMIUM CUSTOM CASSETTES
│
└── OPEN
    └── RECIPIENT EXPERIENCE
```

The top navigation should remain minimal.

Recommended:

```text
CASSETTE

[The Shelf]   [Make a Tape]   [Gifts]

                         [Open a Tape]
```

On mobile:

```text
CASSETTE
                [Make]
```

Secondary navigation can live in a small menu.

---

# 13. HOMEPAGE — THE TAPE SHELF

This is the biggest change from the original landing-page concept.

The homepage should not begin like a conventional SaaS hero.

It should feel like entering a small physical archive.

## Opening scene

Full viewport.

A warm room / desk / shelf.

Not photorealistic.

More like:

> editorial illustration + tactile 3D objects + subtle depth.

A shelf holds several cassettes.

Each cassette is a public tape.

The user can browse them.

---

## 13.1 Hero copy

Primary:

# **Put your feelings on tape.**

Secondary:

> Little digital mixtapes made by people for people.

Actions:

**MAKE A TAPE**

**OPEN A TAPE**

But the copy should not dominate the screen.

The cassette shelf is the hero.

---

# 14. PUBLIC CASSETTE SHELF

## Purpose

This is not a social feed.

It is an object collection.

Think:

> old cassette shelf in a bedroom.

Each public tape is represented as a physical cassette.

---

## Shelf layout

Desktop:

```text
┌──────────────────────────────────────────────────────┐
│                                                      │
│  THE TAPE SHELF                                      │
│                                                      │
│   📼      📼          📼       📼       📼            │
│  red     cream       blue     clear     yellow       │
│                                                      │
│  ────────────────────────────────────────────────     │
│                                                      │
│     📼       📼       📼          📼                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Do not use a grid of identical cards.

Vary:

- angle
- height
- cassette color
- label
- placement
- slight rotation

But keep a controlled layout.

---

## 14.1 Shelf interaction

Hover:

- cassette rises 4–8px
- slight rotation
- soft shadow increases
- label becomes readable
- tiny mechanical sound is optional

Click:

- cassette comes forward
- background dims slightly
- cassette opens into recipient/player view

Mobile:

- horizontal shelf rows
- touch drag
- tap to inspect

---

# 15. PUBLIC TAPE CARD

A cassette itself is the card.

Do not place it inside a generic white card.

Optional metadata appears underneath:

```text
SUMMER '26
for the people who stayed

by @name
```

The tape remains visually dominant.

---

# 16. SHELF CATEGORIES

Do not create an algorithmic feed.

Use simple emotional shelves:

```text
Made for someone
Friendship
Love
Nostalgia
Road trips
Late nights
Birthday
Just because
```

Potential future categories:

```text
Indian nostalgia
Bollywood
College days
Monsoon
Hostel
2000s
First crush
Future self
```

---

# 17. HOMEPAGE FLOW

The homepage should feel like:

```text
ENTER
 ↓
SEE SHELF
 ↓
NOTICE A TAPE
 ↓
PICK IT UP
 ↓
OPEN IT
 ↓
LISTEN
 ↓
WONDER
 ↓
MAKE ONE
```

This is a much stronger emotional acquisition loop than:

```text
hero
 ↓
feature cards
 ↓
pricing
 ↓
CTA
```

---

# 18. LANDING PAGE SECTIONS

## Section 01 — The Shelf

The main experience.

## Section 02 — A Tape Is More Than a Playlist

Show:

```text
SONG
+
MEMORY
+
MESSAGE
+
OBJECT
```

## Section 03 — How It Works

Only three steps:

```text
01 PICK YOUR SONGS
02 WRITE WHAT THEY MEAN
03 SEND THE TAPE
```

## Section 04 — Public Tapes

More shelf.

## Section 05 — Gift a Tape

Premium offering.

## Section 06 — Final emotional CTA

> **Someone should hear what you feel.**

CTA:

**MAKE A TAPE**

---

# 19. CREATE EXPERIENCE

The creation flow should feel like making a physical mixtape.

Do not present it as a normal multi-step form.

---

## Stage 01 — Blank Tape

User enters:

> **Who is this for?**

Options:

```text
Someone I love
My best friend
Family
A memory
Myself
Just because
```

Optional.

The user can skip.

---

## Stage 02 — Choose Blank Tape

Show physical cassette samples.

Example:

```text
Cream
Cherry
Sky
Mint
Transparent
Smoky
```

User picks one.

The cassette physically slides into the workspace.

---

# 20. STAGE 03 — WRITE THE LABEL

The cassette appears large.

User clicks the label.

It expands slightly.

Input:

```text
SUMMER '26
```

Secondary:

```text
for Riya
```

Optional:

```text
made by Akki
```

Preview should update live.

---

# 21. STAGE 04 — ADD SONGS

The user should not feel like they are filling a playlist database.

The interface language should say:

> **Put something on the tape.**

Button:

**ADD A SONG**

When a song is selected:

- track appears on Side A
- cassette label updates track count
- tiny tape sound
- track slides into place

---

# 22. TRACK NOTE EXPERIENCE

This is one of the product's strongest differentiators.

Every song may have:

> **Why did you put this here?**

Examples:

> “This was playing when we first met.”

> “You made me listen to this 400 times.”

> “This reminds me of the train ride home.”

> “Skip this if you're still mad.”

The note is optional.

Do not force emotional writing.

---

# 23. SIDE A / SIDE B

The tape has two physical sides.

Side A:

```text
01
02
03
04
05
06
```

Side B:

```text
01
02
03
04
05
06
```

The cassette itself is the primary control.

Button:

**FLIP TAPE**

Animation:

```text
front
  ↓
slight lift
  ↓
rotate 180°
  ↓
settle
  ↓
SIDE B
```

Do not simply crossfade labels.

The user should perceive the physical flip.

---

# 24. J-CARD / MEMORY NOTE

A real mixtape often had a paper insert.

CASSETTE should recreate this.

The editor can have a physical J-card next to the tape.

Sections:

```text
SIDE A
tracklist

SIDE B
tracklist

NOTE
"for when you miss me..."

FROM
Akki

TO
Riya
```

On mobile, the J-card can slide underneath the cassette.

---

# 25. RECORDING MODE

This should be the emotional climax of creation.

The user does not just click:

> Publish.

They click:

# **RECORD TAPE**

---

## Recording sequence

### 01

Cassette moves into deck.

Text:

> INSERTING BLANK TAPE...

### 02

Deck closes.

Click.

### 03

Tape reels start moving.

### 04

A small REC light turns on.

### 05

Progress begins.

```text
RECORDING SIDE A

01 ────────────────
02 ────────────────
03 ────────────────
```

### 06

Side A completes.

Text:

> SIDE A RECORDED.

### 07

Tape ejects slightly.

Text:

> FLIP THE TAPE.

### 08

User flips.

### 09

Side B records.

### 10

Tape finishes.

### 11

Tape rewinds to beginning.

### 12

Final message:

> **Your tape is ready.**

This is the key moment that competitors can be designed around.

---

# 26. IMPORTANT — RECORDING REALISM

The product may not literally be recording copyrighted audio into a new audio file.

The interface should simulate the ritual of recording.

Therefore the UI should distinguish:

```text
Recording experience
```

from:

```text
Actual audio recording / music storage
```

The production music architecture must follow the legally permitted playback strategy defined in the PRD.

Do not build a fake recording pipeline that stores unauthorized music.

---

# 27. CASSETTE PLAYER

The player should be the signature component of CASSETTE.

It should feel like an actual little machine.

---

## 27.1 Player structure

```text
┌────────────────────────────────────────────┐
│                                            │
│              CASSETTE DECK                │
│                                            │
│        ┌────────────────────────┐          │
│        │      ●        ●        │          │
│        │        SIDE A          │          │
│        │     SUMMER '26         │          │
│        └────────────────────────┘          │
│                                            │
│  ◀◀       ▶ / ❚❚       ■       ▶▶         │
│                                            │
│        00:42 / 04:16                       │
│                                            │
└────────────────────────────────────────────┘
```

---

# 28. INSERTION ANIMATION

The first play should require:

> **INSERT**

Button.

When pressed:

1. cassette lifts
2. cassette moves toward deck
3. cassette rotates slightly
4. slot opens
5. cassette slides in
6. slot closes
7. tiny mechanical click
8. player activates
9. reels begin turning
10. song begins

This should be one of the most satisfying interactions in the entire product.

---

# 29. PLAY ANIMATION

When playing:

- left reel rotates
- right reel rotates
- rotation speed corresponds to playback state
- tape strip can subtly move
- play button remains visually pressed
- REC light is OFF
- small level meter can move very subtly

Do not make the reel rotation too fast.

It should feel mechanically believable.

---

# 30. PAUSE

On pause:

- reels decelerate
- stop naturally
- button depresses
- audio pauses
- UI remains stable

Never instantly snap rotation from full speed to zero.

Use a short deceleration.

---

# 31. REWIND

When rewind is held:

- reels accelerate
- tape counter moves backward
- audio behavior should match the chosen playback implementation
- release returns to normal
- reels decelerate

UI label:

> REWINDING

Optional sound:

short mechanical tape movement.

---

# 32. FAST-FORWARD

Same principle.

The animation should communicate:

> physical mechanism under tension.

Not:

> digital seek bar.

---

# 33. STOP

Stop should:

- stop audio
- stop reels
- reset/retain position depending on product decision
- visually release the deck
- optionally allow eject

---

# 34. EJECT

Eject is important.

Press:

**EJECT**

Sequence:

```text
click
 ↓
slot opens
 ↓
cassette rises
 ↓
cassette moves toward user
 ↓
rest position
```

Then the user can:

**INSERT AGAIN**

This creates a complete physical loop.

---

# 35. SIDE B EXPERIENCE

Do not make Side B a tab.

Side B is a physical event.

Recommended:

```text
EJECT
 ↓
cassette comes out
 ↓
user flips cassette
 ↓
cassette slides back
 ↓
SIDE B appears
 ↓
play
```

On desktop, user can drag to rotate.

On mobile, a swipe gesture can initiate the flip.

Always provide a normal button for accessibility.

---

# 36. PLAYER LAYOUT — DESKTOP

Desktop can become an immersive desk.

Example:

```text
┌───────────────────────────────────────────────────────────┐
│                                                           │
│      J-CARD                        CASSETTE DECK           │
│                                                           │
│   ┌───────────────┐             ┌─────────────────────┐   │
│   │ TRACKLIST     │             │                     │   │
│   │               │             │      CASSETTE       │   │
│   │ 01 Song       │             │                     │   │
│   │ 02 Song       │             │       ●     ●       │   │
│   │ 03 Song       │             │                     │   │
│   └───────────────┘             └─────────────────────┘   │
│                                                           │
│                     PLAYER CONTROLS                       │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

Desktop should not merely stretch mobile.

---

# 37. PLAYER LAYOUT — MOBILE

Mobile should focus on one object.

```text
        ← back

      someone made
       this for you

       ┌───────────┐
       │           │
       │ CASSETTE  │
       │           │
       └───────────┘

      [ INSERT TAPE ]

      Track 01
      Song — Artist

      [◀] [▶] [▶▶]

      Side A
```

J-card / notes appear below.

---

# 38. RECIPIENT EXPERIENCE

The recipient must NOT need an account.

Opening a tape should feel like receiving a gift.

---

## Entry screen

A small envelope / package.

Copy:

# **Someone made this for you.**

Secondary:

> Take a minute.

CTA:

**OPEN THE TAPE**

---

# 39. OPENING THE GIFT

Animation:

```text
sealed envelope
 ↓
open flap
 ↓
J-card appears
 ↓
cassette slides out
 ↓
cassette lands on surface
 ↓
message appears
```

Message:

> **For Riya**

> made by Akki

Then:

**INSERT TAPE**

Do not autoplay audio immediately.

Give the recipient control.

---

# 40. FIRST PLAY

The first play should feel ceremonial.

User taps:

**INSERT TAPE**

Then the physical sequence happens.

This is the moment the product earns its value.

---

# 41. NOTES DURING PLAYBACK

When a track has a personal note:

The note should not interrupt playback.

Instead:

```text
TRACK 03

Frank Ocean — ...

"this reminds me of that night..."
```

A small paper note can slide out.

On mobile:

- bottom sheet
- optional tap
- subtle reveal

---

# 42. END OF SIDE A

When Side A ends:

Do NOT automatically jump to Side B.

Instead:

> **SIDE A IS DONE.**

Then:

**FLIP TO SIDE B**

This recreates the physical ritual.

---

# 43. END OF TAPE

When Side B finishes:

The tape stops.

The UI reveals:

> **That's the whole tape.**

Then:

> **Want to make one back?**

CTA:

# MAKE ONE BACK

Secondary:

**KEEP LISTENING**

---

# 44. MAKE ONE BACK

This is a critical viral interaction.

Do not say:

> Create your own tape.

Say:

> **Make one back.**

This turns the product into a social exchange rather than a one-way gift.

---

# 45. GIFTING PRODUCT

This is the monetization layer.

The free product should remain emotionally complete.

The paid product should sell:

> **more care, more customization, more presentation.**

Not basic functionality.

---

# 46. GIFTING POSITIONING

Homepage section:

# **Make it feel even more yours.**

Subtext:

> Turn your digital tape into a little keepsake.

Possible paid features:

- premium cassette bodies
- premium label materials
- custom artwork
- special J-cards
- custom envelope
- animated gift opening
- premium handwriting styles
- QR card
- physical keepsake in future

---

# 47. PREMIUM GIFT CREATOR

The paid editor should feel like a craft table.

```text
┌────────────────────────────────────────────┐
│                                            │
│          YOUR TAPE                         │
│                                            │
│      [ large cassette ]                    │
│                                            │
│  MATERIAL       LABEL       CARD           │
│  ○ Cream        ○ Paper     ○ Letter       │
│  ○ Clear        ○ Gloss     ○ Memory       │
│  ○ Red          ○ Matte     ○ Photo        │
│                                            │
└────────────────────────────────────────────┘
```

Avoid an e-commerce-looking grid.

---

# 48. CUSTOM MESSAGE EXPERIENCE

Do not just provide:

```text
Message:
[____________]
```

Use prompts.

Examples:

> **What do you want them to remember?**

> **Where were you when you heard this?**

> **What song says what you can't?**

> **What should they play first?**

User can answer one, several, or none.

This creates better emotional content without forcing it.

---

# 49. PERSONALIZATION LEVELS

### Free

- title
- names
- basic label
- tracklist
- track notes
- standard tape styles

### Premium

- advanced label materials
- custom cover
- custom J-card
- premium envelope
- special animations
- advanced typography
- memory card
- QR card

### Future physical

- printed card
- cassette-style keepsake
- NFC
- physical cassette where legally and operationally feasible

---

# 50. MONETIZATION UX RULE

Never interrupt the emotional moment with a paywall.

Bad:

> Upgrade to send this tape.

Good:

> Your tape is ready.

Then later:

> **Want to turn this into a keepsake?**

The user should already have received value before being asked to pay.

---

# 51. PRICING PRESENTATION

Do not show a huge SaaS pricing table.

Use product cards:

```text
DIGITAL TAPE
Free

Your little mixtape on the internet.

[Make one]
```

```text
GIFT TAPE
₹199 / ₹299 / etc.

Extra personalization and keepsake presentation.

[Make it special]
```

Final prices should be validated commercially before launch.

---

# 52. SHARE EXPERIENCE

After recording:

```text
YOUR TAPE IS READY

SUMMER '26
for Riya

[ SEND IT TO THEM ❤️ ]

[ COPY LINK ]

[ OPEN TAPE ]
```

The share action should feel like placing the cassette in an envelope.

---

# 53. SHARE ANIMATION

When user taps send:

1. cassette enters case
2. case closes
3. envelope appears
4. label becomes visible
5. envelope slides outward
6. link/share UI appears

The animation should be short enough not to delay sharing.

Provide immediate fallback.

---

# 54. SOCIAL PREVIEW

Every public tape should generate a beautiful preview.

Suggested structure:

```text
┌───────────────────────────┐
│                           │
│          📼               │
│                           │
│       SUMMER '26          │
│                           │
│       FOR RIYA            │
│                           │
│       made by Akki        │
│                           │
└───────────────────────────┘
```

Keep private/unlisted tape information out of previews unless explicitly intended.

---

# 55. PUBLIC TAPE PAGE

A public tape should still feel like an object.

URL opens:

```text
cassette.fm/tape/...
```

First viewport:

```text
        SUMMER '26

     ┌───────────────┐
     │   CASSETTE    │
     └───────────────┘

     by Akki

     [ INSERT TAPE ]
```

Below:

- description
- tracklist
- notes
- Make One Back
- share

No likes/comments/followers in MVP.

---

# 56. PUBLIC SHELF VS FEED

The PRD explicitly warns against turning CASSETTE into an infinite social network.

Therefore:

## Never use

```text
For You
Trending
Recommended
Endless feed
```

as the primary experience.

## Prefer

```text
The Shelf
The Rack
Found Tapes
Recently Made
From the Community
```

A person should browse objects.

---

# 57. NAVIGATION

## Desktop

```text
CASSETTE

The Shelf
Make a Tape
Gifts

                              Open a Tape
```

## Mobile

Top:

```text
CASSETTE              +
```

Bottom optional:

```text
Shelf      Make      Gifts
```

But avoid app-like navigation if it makes the site feel generic.

The object remains the primary navigation metaphor.

---

# 58. COMMAND / UTILITY UI

Keep conventional web UI available.

Examples:

- share
- copy
- settings
- close
- back
- edit
- delete

These can use clean Apple-like controls.

The nostalgia belongs to the object, not every button.

---

# 59. BUTTON SYSTEM

Primary:

```text
Make a Tape
Open Tape
Insert
Play
Send It
Make One Back
```

Buttons should feel tactile.

### Primary button

- solid
- rounded 14–18px
- subtle shadow
- press scale: 0.98

### Secondary

- light surface
- border
- no excessive shadow

### Physical buttons

Player controls can have a stronger mechanical treatment.

---

# 60. ICONOGRAPHY

Use simple icons.

Prefer:

- SF Symbols style
- Lucide
- custom SVG for cassette-specific mechanics

Do not use random emoji icons in controls.

Emoji can exist inside tape labels and user content.

---

# 61. CASSETTE COMPONENT ANATOMY

The cassette should be implemented as a reusable system.

```text
Cassette
├── Shell
├── ShellHighlight
├── Screw x4
├── ReelLeft
├── ReelRight
├── TapeWindow
├── TapeStrip
├── Label
├── LabelText
├── SideIndicator
├── BrandMark
└── OptionalSticker
```

---

# 62. CASSETTE STATES

The component must support:

```text
IDLE
HOVER
SELECTED
INSERTING
INSERTED
PLAYING
PAUSED
STOPPED
REWINDING
FAST_FORWARDING
EJECTING
FLIPPING
RECORDING
RECORDED
SIDE_A
SIDE_B
ERROR
```

Each state must have a defined visual and motion behavior.

---

# 63. PLAYER STATE MACHINE

```text
EJECTED
   │
   │ INSERT
   ▼
INSERTING
   │
   ▼
READY
   │
   ├── PLAY → PLAYING
   │
   ├── FLIP → EJECTING → FLIPPING → READY
   │
   └── EJECT → EJECTING → EJECTED

PLAYING
   ├── PAUSE → PAUSED
   ├── STOP → READY
   ├── REWIND → REWINDING
   └── FF → FAST_FORWARDING

PAUSED
   └── PLAY → PLAYING
```

---

# 64. MOTION PRINCIPLES

Motion must communicate material behavior.

## Rule 01

Heavy objects move slightly slower.

## Rule 02

Buttons depress quickly.

## Rule 03

Tape reels accelerate/decelerate.

## Rule 04

Paper moves with slight delay.

## Rule 05

Plastic should have small bounce, not cartoon bounce.

## Rule 06

No animation exists merely to show off.

---

# 65. MOTION TIMING

Recommended starting values:

```text
Micro interaction: 120–180ms
Button press: 100–140ms
Panel: 220–320ms
Cassette movement: 500–800ms
Flip: 700–1000ms
Insertion: 800–1200ms
Gift opening: 1000–1600ms
Recording transition: 500–900ms
```

Tune after prototype testing.

---

# 66. EASING

Use physically believable curves.

Recommended:

```text
ease-out
cubic-bezier(.22,1,.36,1)
```

For mechanical movement:

```text
cubic-bezier(.2,.8,.2,1)
```

Avoid constant linear movement except for reel rotation.

---

# 67. REDUCED MOTION

Provide:

```text
prefers-reduced-motion
```

When enabled:

- no 3D flips
- no large object movement
- no decorative parallax
- no animated background
- reels may remain static
- state changes remain understandable

Accessibility must never remove functionality.

---

# 68. SOUND DESIGN

Sound should feel like a cassette deck.

Possible sounds:

- insert click
- eject click
- play button click
- pause click
- stop click
- reel movement
- rewind
- fast-forward
- tape recording
- case closing

Rules:

- very short
- subtle
- no constant hum
- no autoplay sound
- global sound toggle
- respect browser autoplay policies

Recommended default:

> **Sound effects OFF until user interacts.**

Once user enables sound, remember the preference.

---

# 69. AUDIO / MUSIC ARCHITECTURE CONSTRAINT

The original PRD correctly treats music licensing as a major technical/business risk.

Do not assume Spotify can be the commercial playback foundation.

Possible strategies include:

- licensed music
- authorized music provider integration
- external playback
- user-owned/licensed audio
- royalty-free/public-domain library

Prototype the physical interaction independently from the final music rights architecture.

The design system must therefore work with:

```text
Track metadata
+
Authorized playback source
```

rather than assuming raw music files exist inside the application.

---

# 70. TRACK LIST DESIGN

Tracklist should feel like a handwritten insert.

Example:

```text
SIDE A

01  Satellite
    Harry Styles

02  Speed of Sound
    Coldplay

03  I Wish You Roses
    Kali Uchis
```

Track notes appear as small paper annotations.

---

# 71. RECORDING PROGRESS UI

Instead of a generic progress bar:

```text
REC ●

SIDE A

01 ███████████
02 ███████████
03 ███████────
04 ───────────

00:18 / 22:00
```

Add tiny mechanical details.

Do not turn it into a dashboard.

---

# 72. LOADING STATES

Never use a generic spinner if a cassette metaphor is appropriate.

Examples:

> INSERTING TAPE...

> READING LABEL...

> LOADING SIDE A...

> GETTING THE TAPE READY...

Accessibility text should still expose a normal loading state.

---

# 73. ERROR STATES

### Music unavailable

> This track isn't available here anymore.

Actions:

**Replace Track**

**Open Music Provider**

### Tape removed

> This tape has been put away.

### Network issue

> The tape got stuck.

Action:

**Try Again**

The copy is playful, but the action must remain clear.

---

# 74. EMPTY STATES

### No public tapes

> The shelf is quiet.

> Be the first to leave something here.

**MAKE A TAPE**

### No drafts

> Nothing on the workbench yet.

**START A TAPE**

---

# 75. AUTHENTICATION

Opening a tape:

> zero signup.

Creating a basic tape:

> anonymous-first if technically safe.

Account creation can be introduced when the user wants:

- save tapes
- manage archive
- access drafts
- create multiple tapes
- premium purchases

Do not block the emotional moment with authentication.

---

# 76. DRAFT EXPERIENCE

If a user leaves creation:

> **Keep this tape?**

Options:

**Save for later**

**Discard**

If anonymous drafts are supported, store only the necessary data and explain persistence.

---

# 77. MOBILE UX

Mobile is not a smaller desktop.

The mobile experience should feel like holding a cassette.

Priorities:

1. large cassette
2. thumb-friendly controls
3. vertical storytelling
4. swipe gestures
5. bottom sheets
6. minimal chrome
7. fast loading

Touch targets:

> minimum 44×44px.

---

# 78. DESKTOP UX

Desktop should become a more immersive environment.

Possible elements:

- desk
- shelf
- J-card
- cassette
- player
- subtle background depth

But never turn it into a complicated 3D game.

Desktop adds atmosphere.

Mobile preserves clarity.

---

# 79. RESPONSIVE BREAKPOINTS

Suggested:

```text
< 640px
Mobile

640–1024px
Tablet

1024–1440px
Desktop

> 1440px
Large desktop
```

Do not use fixed cassette sizes that cause overflow.

---

# 80. ACCESSIBILITY

Required:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- ARIA labels for physical controls
- screen-reader state announcements
- reduced motion
- sufficient contrast
- accessible forms
- keyboard alternative for every gesture
- no hover-only information
- no sound-only feedback

Example:

```html
<button aria-label="Play tape">
```

For cassette state:

```text
"Side A, paused, track 3 of 6"
```

---

# 81. DESIGN SYSTEM COMPONENT INVENTORY

## Core

- Button
- IconButton
- TextInput
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Modal
- Drawer
- BottomSheet
- Tooltip
- Toast
- Tabs

## CASSETTE

- Cassette
- CassetteShell
- Reel
- TapeLabel
- TapeWindow
- CassetteDeck
- DeckButton
- PlayerControls
- TapeCounter
- SideIndicator
- JCard
- TrackRow
- TrackNote
- Envelope
- GiftBox
- Shelf
- ShelfRow
- TapeCard

## Product

- TapeEditor
- TapeRecorder
- TapePreview
- SharePanel
- GiftCustomizer
- PublicTape
- RecipientExperience

---

# 82. DESIGN TOKENS

Recommended token categories:

```text
color/
  background
  surface
  surface-elevated
  text
  text-secondary
  border
  accent
  danger

cassette/
  shell
  shell-highlight
  label
  reel
  screw
  tape

motion/
  micro
  standard
  object
  dramatic

radius/
  control
  card
  object

shadow/
  soft
  object
  pressed
```

Avoid hardcoding values throughout components.

---

# 83. TAPE THEMING ENGINE

A tape theme should control:

```text
shellColor
labelColor
labelTexture
inkColor
reelColor
accentColor
stickerStyle
typographyStyle
```

Example:

```json
{
  "name": "Cherry",
  "shellColor": "#E94B4B",
  "labelColor": "#FFF7E8",
  "inkColor": "#1D1D1F",
  "accentColor": "#FFCC00"
}
```

The actual implementation should use design tokens, not arbitrary CSS everywhere.

---

# 84. REFERENCE IMAGE STRATEGY

The user-provided Pinterest references should guide:

### Cassette shape

Use realistic proportions.

### Label typography

Use handwritten references.

### Plastic

Reference transparent and translucent shells.

### Color

Use:

- cream
- red
- yellow
- blue
- smoky clear
- black accents
- faded vintage tones

### Photography

Use real physical objects as inspiration for 3D modeling, illustration, or asset creation.

Do not directly scrape copyrighted Pinterest images for production UI.

---

# 85. IMAGE / ASSET DIRECTION

Use three classes of assets.

## A. Product-rendered assets

Best for:

- cassette
- deck
- shelf
- envelope
- J-card

These should be custom.

## B. Texture assets

- paper grain
- plastic grain
- dust
- subtle scratches

Use compressed WebP/AVIF.

## C. Editorial / lifestyle imagery

Use sparingly.

Potential scenes:

- bedroom desk
- old stereo
- school bag
- road trip
- handwritten notes
- record shop
- family car

The product should not become an image gallery.

---

# 86. 3D VS 2D

Do not make the entire product true 3D.

Recommended hybrid:

```text
CSS/SVG
+
2.5D transforms
+
pre-rendered cassette assets
+
small motion layers
```

Use true WebGL/3D only if a prototype proves it improves the experience.

The visual target is:

> believable physicality

not:

> technical 3D demonstration.

---

# 87. PERFORMANCE

Target:

```text
Lighthouse Performance ≥ 90
Accessibility ≥ 90
Best Practices ≥ 90
SEO ≥ 90
```

Avoid:

- giant hero videos
- huge PNG textures
- unnecessary WebGL
- excessive DOM nodes
- animation-heavy page backgrounds

Use:

- WebP/AVIF
- lazy loading
- SVG
- CSS transforms
- GPU-friendly transform/opacity
- dynamic imports for heavy editor/player modules

---

# 88. SEO

Public tapes may be indexable.

Private/unlisted tapes:

```text
noindex
```

Landing page concepts:

- digital mixtape
- online cassette
- virtual mixtape
- send a mixtape
- digital love letter
- nostalgic playlist
- music gift

Do not keyword stuff.

---

# 89. SOCIAL SHARING

The product should naturally generate social posts.

Examples:

> Someone made me a cassette 😭

> I made this for my girlfriend.

> My best friend sent me this.

> This website lets you make digital mixtapes.

The UI should make screenshots naturally beautiful.

---

# 90. SHAREABLE MOMENT DESIGN

Every tape should have a screenshot-worthy state:

```text
cassette
+
label
+
recipient
+
creator
+
beautiful background
```

This should work without requiring users to manually design a social graphic.

---

# 91. MONETIZATION STRATEGY

The original PRD recommends not immediately adding:

- ads
- intrusive banners
- sponsored tapes
- autoplay ads
- subscription walls
- “upgrade to share”

Keep that decision.

Instead:

## Monetize the object.

Potential revenue:

1. Premium tape designs
2. Premium gift customization
3. Printed memory cards
4. QR keepsakes
5. NFC cards
6. Physical cassette products
7. Special occasion packs
8. Premium long-term storage

The emotional core stays free.

---

# 92. GIFTING FUNNEL

```text
DISCOVER CASSETTE
      ↓
SEE PUBLIC TAPE
      ↓
"MAKE ONE FOR SOMEONE"
      ↓
CREATE
      ↓
FREE DIGITAL TAPE
      ↓
"MAKE IT SPECIAL"
      ↓
PREMIUM CUSTOMIZATION
      ↓
CHECKOUT
      ↓
SEND
```

The paid offer appears after emotional commitment.

---

# 93. PREMIUM OCCASION PACKS

Possible:

- Birthday
- Anniversary
- Valentine's Day
- Graduation
- Farewell
- Friendship
- Long distance
- Wedding
- New Year
- Road trip

Each pack should be a carefully designed visual kit.

Do not create 50 mediocre templates.

Start with 4–6 excellent ones.

---

# 94. CHECKOUT EXPERIENCE

Keep it calm.

No aggressive urgency.

Example:

```text
YOUR GIFT TAPE

Digital tape                 Free
Premium label                ₹XX
Memory card                  ₹XX
QR card                      ₹XX

Total                        ₹XX

[ COMPLETE THE GIFT ]
```

The exact prices should be validated separately.

---

# 95. SUCCESS METRICS FOR UX

The original product metric is:

# Tapes Successfully Sent

Supporting design metrics:

### Creation

- landing → create
- create started
- songs added
- note added
- tape recorded
- tape completed

### Recipient

- tape opened
- insert clicked
- play started
- Side B opened
- notes viewed
- tape completed
- Make One Back clicked

### Viral

```text
creator
 ↓
recipient
 ↓
new creator
```

The most meaningful behavioral signal is:

> recipient → creator conversion.

---

# 96. UX EXPERIMENTS

## Experiment A

```text
MAKE A PLAYLIST
vs
MAKE A TAPE
```

Hypothesis:

“Make a Tape” better communicates the object.

## Experiment B

```text
SHARE
vs
SEND IT TO THEM ❤️
```

Hypothesis:

emotional language increases sharing.

## Experiment C

```text
CREATE YOUR OWN
vs
MAKE ONE BACK
```

Hypothesis:

“Make One Back” creates reciprocity.

## Experiment D

```text
music only
vs
music + personal notes
```

Hypothesis:

notes increase emotional value.

---

# 97. MICROCOPY SYSTEM

## Landing

> Put your feelings on tape.

## Create

> Make something worth sending.

## Song

> Put something on the tape.

## Note

> Why does this one matter?

## Recording

> Recording...

## Complete

> Your tape is ready.

## Recipient

> Someone made this for you.

## Playback

> Press play.

## Side A complete

> Side A is done.

## Side B

> Flip the tape.

## End

> That's the whole tape.

## Viral loop

> Make one back.

---

# 98. EMOTIONAL COPY PRINCIPLES

Never over-explain.

Prefer:

> “For when you miss me.”

over:

> “This playlist contains songs selected to evoke feelings of nostalgia.”

Prefer:

> “This one is ours.”

over:

> “This track has sentimental significance.”

Shorter feels more personal.

---

# 99. DESIGN DO / DON'T

## DO

- use whitespace
- make objects large
- use tactile shadows
- use happy accent colors
- keep UI modern
- use subtle textures
- make cassette interactions believable
- preserve user control
- make the first play special

## DON'T

- neon green
- black cyberpunk UI
- heavy gradients
- excessive glassmorphism
- infinite social feed
- 3D everywhere
- huge animation sequences for basic actions
- autoplay music
- forced signup
- fake retro filters over everything

---

# 100. END-TO-END EXPERIENCE MAP

## Creator

```text
HOME
 ↓
THE SHELF
 ↓
MAKE A TAPE
 ↓
WHO IS IT FOR?
 ↓
CHOOSE BLANK TAPE
 ↓
WRITE LABEL
 ↓
ADD SONGS
 ↓
ADD PERSONAL NOTES
 ↓
SIDE A
 ↓
FLIP
 ↓
SIDE B
 ↓
PREVIEW
 ↓
RECORD
 ↓
INSERT
 ↓
RECORD SIDE A
 ↓
FLIP
 ↓
RECORD SIDE B
 ↓
REWIND
 ↓
TAPE READY
 ↓
SEND IT TO THEM
 ↓
SHARE
```

## Recipient

```text
OPEN LINK
 ↓
ENVELOPE
 ↓
"A TAPE FOR YOU"
 ↓
OPEN
 ↓
CASSETTE APPEARS
 ↓
INSERT
 ↓
PLAY
 ↓
READ NOTES
 ↓
SIDE A FINISHES
 ↓
FLIP
 ↓
SIDE B
 ↓
TAPE ENDS
 ↓
"MAKE ONE BACK"
```

## Paid gift

```text
CREATE
 ↓
CUSTOMIZE
 ↓
PREVIEW
 ↓
"MAKE IT SPECIAL"
 ↓
PREMIUM GIFT
 ↓
CHECKOUT
 ↓
SEND
```

---

# 101. PAGE INVENTORY

## Public

- `/`
- `/shelf`
- `/tape/[slug]`
- `/gifts`
- `/about`

## Creator

- `/make`
- `/make/details`
- `/make/tracks`
- `/make/design`
- `/make/record`
- `/make/share`

The actual implementation may combine steps into fewer routes.

## Account — later

- `/me`
- `/me/tapes`
- `/me/received`
- `/me/drafts`
- `/me/settings`

Do not build account dashboards before the core experience works.

---

# 102. FIRST PROTOTYPE PRIORITY

Before backend development, build only:

```text
1. Cassette object
2. Insert animation
3. Play animation
4. Pause
5. Rewind
6. Fast-forward
7. Eject
8. Flip Side A/B
9. Recording animation
10. J-card
11. Public shelf
12. Gift opening
```

Use fake/test audio.

Do not allow music licensing to block the UX prototype.

---

# 103. IMPLEMENTATION ORDER

## Phase 0 — Visual prototype

Goal:

> Make the cassette feel real.

Build:

- cassette
- deck
- shelf
- animation
- sound
- J-card

## Phase 1 — Creation

Build:

- tape metadata
- label
- tracks
- notes
- Side A/B
- themes

## Phase 2 — Recording ritual

Build:

- insert
- recording
- flip
- rewind
- completion

## Phase 3 — Recipient

Build:

- gift opening
- cassette playback
- notes
- Make One Back

## Phase 4 — Sharing

Build:

- unique URLs
- OG previews
- Web Share
- copy link

## Phase 5 — Public shelf

Build:

- public tapes
- categories
- shelf presentation

## Phase 6 — Monetization

Build:

- premium customization
- checkout
- gift products

---

# 104. TECHNICAL DESIGN PRINCIPLES FOR FRONTEND

Recommended direction from the PRD:

```text
Next.js
React
TypeScript
Tailwind CSS
Framer Motion
PostgreSQL
Prisma/Drizzle
Object Storage
PostHog
```

The UI should be component-driven.

Important architectural separation:

```text
CassetteVisual
CassetteState
PlaybackController
TapeData
MusicProvider
```

Do not mix music-provider logic into visual cassette components.

---

# 105. COMPONENT CONTRACT

The visual cassette should receive state rather than owning business logic.

Example conceptual API:

```text
<Cassette
  side="A"
  state="playing"
  progress={0.42}
  theme="cream"
  title="Summer '26"
  recipient="Riya"
/>
```

This allows:

- editor
- shelf
- player
- recipient page
- OG renderer

to reuse the same visual language.

---

# 106. DESIGN SYSTEM RULE

If a new feature cannot fit the physical metaphor cleanly, stop and ask:

> **Does this improve the tape or just add functionality?**

The original PRD says the north-star choice should favor emotional magic over feature count.

Keep this rule.

---

# 107. THE SHELF AS A BRAND ASSET

The public shelf can become the visual identity of the product.

Imagine people posting:

> “Look at my tape on the shelf.”

This is more distinctive than a profile feed.

Future shelf ideas:

- seasonal shelves
- community shelves
- city shelves
- college shelves
- event shelves
- curated collections

But avoid turning it into an engagement-optimized feed.

---

# 108. FUTURE PHYSICAL BRIDGE

The long-term product can connect:

```text
DIGITAL TAPE
     ↓
QR CARD
     ↓
PHYSICAL KEEPSAKE
     ↓
NFC
     ↓
PHYSICAL CASSETTE
```

This is not MVP.

But the design system should leave room for it.

The digital object should look printable.

---

# 109. VISUAL QUALITY BAR

Before launch, every major interaction should pass these questions:

### 1

Does it feel physical?

### 2

Does it feel effortless?

### 3

Does it look beautiful in a screenshot?

### 4

Does the user know what to do?

### 5

Does motion explain the action?

### 6

Does it feel emotionally personal?

### 7

Would a recipient understand it without instructions?

### 8

Does the interface still feel modern?

### 9

Does the nostalgia feel authentic rather than costume-like?

### 10

Would I want to send this to someone?

If the answer to #10 is no, the design is not finished.

---

# 110. COMPETITIVE DESIGN POSITIONING

The reviewed products show useful but incomplete directions.

### Mixtape for You

Useful reference for:

- personal presentation
- tape + case + note
- gift framing

### Mewtru

Useful reference for:

- cassette playback metaphor
- “INSERT” interaction
- tape-deck UI

### Make Your Own Mixtape

Useful reference for:

- rack/shelf concept
- physical collection
- object browsing

### Cassettine

Useful reference for:

- simple creation funnel
- music gift positioning
- style/message/playlist customization
- fast creation

CASSETTE should not clone any of these.

The opportunity is to combine:

```text
Mixtape for You
    gift feeling

Mewtru
    playback interaction

Make Your Own Mixtape
    shelf / collection

Cassettine
    monetizable gift creation

CASSETTE
    deeper physical ritual + emotional notes + recording experience
```

---

# 111. IMPORTANT COMPETITIVE LESSON

A previous Cassettine discussion highlights a real product risk:

Users can already create playlists on streaming platforms.

Therefore the product cannot win by making playlist creation slightly prettier.

The value must be:

> **curating and gifting a musical experience.**

The design must therefore spend more effort on:

- presentation
- ritual
- personal notes
- recipient experience
- physical interaction
- shareability
- emotional payoff

and less effort on:

- playlist management complexity
- social metrics
- generic discovery
- dashboard functionality

---

# 112. FINAL DESIGN PRINCIPLES

## Principle 01

**The cassette is the interface.**

## Principle 02

**The object is more important than the chrome.**

## Principle 03

**Color belongs to the tape; the UI stays calm.**

## Principle 04

**Apple-like usability, nostalgic physicality.**

## Principle 05

**Every major animation must explain a physical action.**

## Principle 06

**Do not autoplay the gift. Let the recipient press play.**

## Principle 07

**Do not force signup before emotion.**

## Principle 08

**A personal note is more valuable than another feature.**

## Principle 09

**Make One Back is a product mechanic, not just copy.**

## Principle 10

**Monetize customization, not access to the emotional core.**

## Principle 11

**The shelf is a collection of objects, not a social feed.**

## Principle 12

**Nostalgia should feel authentic, not noisy.**

---

# 113. THE FINAL EXPERIENCE

The ideal experience should feel like this:

You arrive.

You see a shelf.

There are dozens of little tapes.

One catches your attention.

You pick it up.

You see:

> **FOR RIYA**

You open the case.

There is a handwritten note.

You press:

> **INSERT**

The cassette slides into the deck.

Click.

The reels begin turning.

A small display says:

> **Harry Styles — Satellite**

You listen.

A note appears:

> “This reminds me of that night.”

Side A ends.

The tape stops.

You physically flip it.

Side B starts.

When it finishes:

> **Someone made this for you.**

And underneath:

# **MAKE ONE BACK**

That is the product.

Not a playlist.

Not a social network.

Not a nostalgia landing page.

> **A tiny digital object that lets one person leave a piece of themselves with another person.**

---

# 114. MASTER ACCEPTANCE CRITERIA

The UI/UX is considered ready for implementation when:

- [ ] Homepage feels like a physical tape shelf
- [ ] Public tapes look like objects, not cards
- [ ] Cassette is the visual hero
- [ ] UI uses calm Apple-like neutrals
- [ ] Accent colors are warm/happy
- [ ] No black/neon-green visual language
- [ ] Cassette can insert/eject
- [ ] Reels animate naturally
- [ ] Play/pause/rewind/FF feel mechanical
- [ ] Side A/B physically flips
- [ ] Recording sequence feels ceremonial
- [ ] J-card supports personal storytelling
- [ ] Track notes are easy but optional
- [ ] Recipient can open without signup
- [ ] Recipient gets a clear “Someone made this for you” moment
- [ ] Make One Back is prominent after completion
- [ ] Share action feels like sending a physical object
- [ ] Premium gifting does not interrupt free emotional value
- [ ] Mobile experience feels intentional
- [ ] Desktop adds immersion without complexity
- [ ] Reduced-motion mode exists
- [ ] Keyboard controls exist
- [ ] Loading/error states use physical metaphors without sacrificing clarity
- [ ] Public/private privacy rules are respected
- [ ] Music playback architecture remains legally/technically separated from visual cassette behavior
- [ ] Performance remains strong despite visual richness

---

# 115. ONE-SENTENCE DESIGN SPEC

> **Build CASSETTE like Apple designed a tiny cassette deck, then put a handwritten love letter inside it.**

That is the visual and interaction bar.

