---
name: Quraan Shareef · Tara
description: A Bengali-first Quran reader framed in the chini-tikri mosaic of Old Dhaka's Star Mosque.
colors:
  porcelain-ground: "#f3f6fb"
  unglazed-wall: "#ffffff"
  cobalt-ink: "#111c44"
  slate-ink: "#4b567a"
  faded-ink: "#626d8f"
  cobalt: "#2546b4"
  deep-cobalt: "#11226e"
  celadon-shard: "#3f7f69"
  rose-shard: "#b4485f"
  plaster-rule: "#d5dcea"
  plaster-grout: "#e4e9f2"
  night-ground: "#0a1230"
  night-wall: "#0f1a3e"
  night-ink: "#e7ecf8"
  night-cobalt: "#8ea7ff"
typography:
  display-bengali:
    fontFamily: "Tiro Bangla, Noto Serif Bengali, serif"
    fontSize: "clamp(2.2rem, 6vw, 3.4rem)"
    fontWeight: 400
    lineHeight: 1.15
  headline-arabic:
    fontFamily: "Amiri, Noto Naskh Arabic, serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.7
  quran:
    fontFamily: "Amiri Quran, Amiri, Noto Naskh Arabic, serif"
    fontSize: "calc(1.85rem * var(--ar-scale))"
    fontWeight: 400
    lineHeight: 2.15
  body-bengali:
    fontFamily: "Tiro Bangla, Noto Serif Bengali, serif"
    fontSize: "calc(1.12rem * var(--tr-scale))"
    fontWeight: 400
    lineHeight: 1.8
  body-english:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "calc(1rem * var(--tr-scale))"
    fontWeight: 400
    lineHeight: 1.65
  ui-bengali:
    fontFamily: "Hind Siliguri, Noto Sans Bengali, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 700
    lineHeight: 1.3
rounded:
  tile: "2px"
  control: "6px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "72px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.unglazed-wall}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "42px"
  button-primary-hover:
    backgroundColor: "{colors.deep-cobalt}"
  button-secondary:
    backgroundColor: "{colors.unglazed-wall}"
    textColor: "{colors.deep-cobalt}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "42px"
  button-ghost:
    textColor: "{colors.cobalt}"
    rounded: "{rounded.control}"
    padding: "0 16px"
  pill:
    textColor: "{colors.deep-cobalt}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  ayah-card:
    backgroundColor: "{colors.unglazed-wall}"
    rounded: "{rounded.tile}"
    padding: "18px 22px 22px"
  continue-card:
    backgroundColor: "{colors.unglazed-wall}"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.tile}"
    padding: "22px 56px 22px 24px"
---

# Design System: Quraan Shareef · Tara

## Overview

**Creative North Star: "The Unglazed Wall"**

Old Dhaka's Star Mosque (Tara Masjid) is covered in chini-tikri: broken blue-and-white china pressed into lime plaster, studded with eight-pointed stars. This system takes that wall as its frame. Mosaic owns the masthead, the surah openers and the book's covers; inside, the reading surface is the one plain, unglazed wall, where Arabic, Bengali and English sit on white paper with nothing behind them.

The reader is Bengali-first and often reading at night on a phone, so the system is calm and dense where reading happens and expressive only at the edges. State is shown through glaze, a cobalt brightening of the ayah being recited, never through boxes or outlines. The one physical object in the interface is the ribbon, which marks where a reader stopped or what they saved.

The mushaf is treated as a real book: right-to-left spreads on wide screens, a single page on phones, and a page that turns along one curved crease.

**Key Characteristics:**
- Mosaic in the frame, never behind text.
- Cool porcelain by day, cobalt glaze by night by default, switched at sunrise and Maghrib for the reader's city (or by the device). Readers can pick their own day and night themes, or one fixed theme, from six sibling themes.
- Eight-pointed tara stars as ayah markers, numbered in Arabic-Indic digits.
- Bengali numerals and Bengali UI throughout; Latin only for English and verse references.
- Square, tile-cut corners on walls; soft only on controls.

## Colors

A restrained porcelain-and-cobalt palette with two shard accents, taken from blue-and-white china and its occasional celadon and rose fragments.

### Primary
- **Cobalt** (#2546b4): actions, links, ayah-star outlines, the play button, the recited-ayah glaze (at 11% over the wall). Night: #8ea7ff.
- **Deep Cobalt** (#11226e): surah names on openers, headings inside the mushaf, pressed buttons. Night: #c7d3ff.

### Secondary
- **Rose Shard** (#b4485f): the bookmark ribbon only. Night: #eb93a6.
- **Celadon Shard** (#3f7f69): sajda tags and success states. Night: #8cc6b0.

### Neutral
- **Porcelain Ground** (#f3f6fb): app background, a grey biased toward cobalt. Night: Night Ground #0a1230.
- **Unglazed Wall** (#ffffff): every reading surface (ayah cards, mushaf pages, the Continue card). Night: Night Wall #0f1a3e.
- **Cobalt Ink** (#111c44): Arabic text and primary text. Night: #e7ecf8.
- **Slate Ink** (#4b567a): translations and secondary text. Night: #a9b4d2.
- **Faded Ink** (#626d8f): verse references, running heads, folios. Night: #8f9abb.
- **Plaster Rule** (#d5dcea) and **Plaster Grout** (#e4e9f2): hairlines, input borders, and the mortar between mosaic shards.

### Named Rules
**The Unglazed Wall Rule.** Reading surfaces are plain wall colour. No mosaic, gradient, pattern or ad ever sits behind or beside Arabic text.

**The Glaze Rule.** State is a change in glaze brightness (cobalt at 10–14% over the wall), never an outline or a border.

### Themes
Every theme is the same system re-fired in a different Bengal material: one family, one accent, the same token names (`--cobalt` is "the accent" whatever its hue). Each sets the full token set in `globals.css` under `:root[data-theme="<id>"]`, including the mosaic shards (`--sh-*`), the grout and `--shade` (the rgb triplet for scrims, the page-turn crease and the spine). Metadata for the picker lives in `src/lib/themes.ts`. Every pair used for text clears 4.5:1, including button text (`--paper` on the accent).

| Theme | Kind | Material | Ground / paper | Accent | Ribbon |
|---|---|---|---|---|---|
| চীনামাটি (`light`) | day | Star Mosque blue-and-white china | #f3f6fb / #ffffff | cobalt #2546b4 | rose #b4485f |
| মুসহাফের পাতা (`paper`) | day | a printed mushaf's cream leaf, iron-gall ink | #efe6d2 / #faf5ea | illumination gold #8a5a10 | madder #9c3b2e |
| পোড়ামাটি (`terracotta`) | day | Bagha Mosque carved brick | #f0e2d2 / #fbf4eb | brick #a1421d | river green #2f6b5e |
| মোগল সবুজ (`celadon`) | day | Lalbagh green glaze on plaster | #edf3ef / #ffffff | Mughal green #1d6a4e | vermilion #a8462f |
| কোবাল্ট রাত (`dark`) | night | cobalt glaze | #0a1230 / #0f1a3e | #8ea7ff | #eb93a6 |
| লণ্ঠন (`lantern`) | night | true black at Isha, lamp light | #000000 / #0e0c09 | lamp gold #e0ac52 | ember #e08a7c |

**The Sibling Rule.** A new theme is a material from the same world, never a skin from outside it: one accent, mosaic re-coloured from the same shard roles, contrast checked before it ships.

## Typography

**Display Font:** Tiro Bangla (with Noto Serif Bengali)
**Quran Font:** Amiri Quran (with Amiri, Noto Naskh Arabic)
**Heading Arabic:** Amiri 700
**UI Fonts:** Hind Siliguri for Bengali controls; Schibsted Grotesk for English and verse references

**Character:** A book-hand Bengali display face next to a classical Naskh Quran face, with two quiet sans faces doing the interface work. The Arabic is always the largest text in its block.

### Hierarchy
- **Display** (Tiro Bangla 400, clamp(2.2rem, 6vw, 3.4rem), 1.15): the app name on the masthead tile.
- **Headline** (Tiro Bangla 400, clamp(1.6rem, 4vw, 2.2rem)): surah titles. Arabic surah names on openers in Amiri 700 at 2rem.
- **Quran** (Amiri Quran, 1.85rem × reader scale, 2.15): ayah text in Translation mode. In Mushaf mode the size is fitted per page so the text fills the frame.
- **Body** (Tiro Bangla 1.12rem / Schibsted 1rem × translation scale, 1.65–1.8, max 68ch): translations.
- **Label** (Schibsted 700, 0.85rem, tabular numerals): verse references like 18:10.

### Named Rules
**The Script Numerals Rule.** Arabic-Indic digits inside Arabic text and on mushaf pages, Bengali digits in the Bengali interface, Latin digits only in English text and verse references.

**The Two Dials Rule.** Arabic size and translation size are set separately by the reader (--ar-scale 0.8–1.6, --tr-scale 0.85–1.4).

## Layout

A single 1120px column with a 16px gutter. Home stacks a mosaic masthead, an overlapping row of two wall tiles (Continue, Jump), a 15-column juz grid (10 at tablet, 6 on phones) and a two-column surah index (one column below 860px). Translation mode narrows to 860px with ayah cards 12px apart and a fixed player bar at the bottom. Mushaf mode sizes the book to the viewport height: a two-page spread at 2:1.5 when the window is at least 900px wide and landscape, otherwise one page using the full remaining height. Spacing runs on a 4px base: 4, 8, 12, 16, 24, 32, 48, 72.

## Elevation & Depth

Mostly flat wall-on-ground layering. Tiles lift off the ground with one soft ambient shadow; mushaf pages use a deeper page shadow so the book reads as an object on the table. The only other depth is the page turn's 3D rotation.

### Shadow Vocabulary
- **Tile** (`box-shadow: 0 1px 2px rgba(17,28,68,.06), 0 8px 24px -8px rgba(17,28,68,.18)`): masthead tile, Continue and Jump cards, bookmarks, the settings sheet.
- **Page** (`box-shadow: 0 2px 4px rgba(17,28,68,.08), 0 24px 48px -16px rgba(17,28,68,.28)`): mushaf pages.
- **Crease** (gradient driven by `--bend`, peaking at 45% of the turn): the shadow across a turning page.

## Shapes

Tile-cut. Walls, cards, openers and pages use 2px corners, like set tiles. Controls soften to 6px. Pills and the play button are fully round. Two silhouettes repeat: the eight-pointed tara star (ayah markers, surah numbers, the brand mark, mosaic stars) and the ribbon (a strip with a notched tail).

## Components

### Buttons
- **Shape:** soft control corners (6px), 42px tall, no wrapping.
- **Primary:** cobalt fill, white text, 0 16px; hover deepens to Deep Cobalt; pressed moves down 1px.
- **Secondary:** wall fill with a plaster hairline; hover turns the border cobalt.
- **Ghost:** cobalt text only; hover adds a 7% glaze.

### Pills
- **Style:** glaze (7%) background, Deep Cobalt text, round. Used for player speed and repeat.

### Cards / Containers
- **Corner Style:** tile (2px).
- **Background:** Unglazed Wall.
- **Shadow Strategy:** Tile shadow on home cards; ayah cards are flat on the ground.
- **Internal Padding:** 18–24px.

### Inputs / Fields
- **Style:** porcelain fill, plaster hairline, 6px corners, 46px tall.
- **Focus:** border turns cobalt; the global focus ring is a 2px cobalt outline 3px out.

### Navigation
- **Style:** sticky translucent header (56px), brand star plus the Bengali name, two Hind Siliguri links and a settings button. The current link gets a glaze background.

### Ayah Star (signature)
An eight-pointed star made of a 14% glaze fill and a cobalt outline, carrying the ayah number in Arabic-Indic digits. It sits inline after the ayah, joined to the last word by a non-breaking space.

### Mosaic (signature)
Canvas-drawn chini-tikri from a seed: a jittered grid split into triangle and quad shards, inset by grout, filled from the shard tokens (white 38%, pale 20%, blue 20%, deep 10%, celadon 7%, rose 5%), with arcs of painted pattern on light shards and optional tara stars. It redraws for the night palette. Used on the masthead, surah openers and book covers only.

### Ribbon
A rose strip with a notched tail, hanging from the top edge of the Continue card and of bookmarked ayahs.

### Mushaf Page
A double-ruled cobalt frame (1px rule plus a 45% outline offset 0.9cqi), an Arabic running head (surah name, juz), surah openers as mosaic bands with the name on a wall tile, justified Quran text fitted to the frame, and an Arabic-Indic folio.

## Do's and Don'ts

### Do:
- **Do** keep mosaic in the frame: masthead, surah openers, covers (The Unglazed Wall Rule).
- **Do** show playing, arriving and selected states with cobalt glaze at 10–14% over the wall.
- **Do** set `lang` and `dir` on every block of Arabic, Bengali and English.
- **Do** turn pages right to left: the left page lifts and turns over to the right, and ArrowLeft moves forward.
- **Do** fall back to an instant page change when reduced motion is on.

### Don't:
- **Don't** put a label or eyebrow above a card title; the action goes on a closing line instead.
- **Don't** outline or box an ayah to show state.
- **Don't** animate, crop or overlay the Arabic text.
- **Don't** use the rose shard for anything other than ribbons.
