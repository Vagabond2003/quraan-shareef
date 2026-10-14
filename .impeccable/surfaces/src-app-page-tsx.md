---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/surah","src/app/mushaf"]
---

Scope: the reader app (Home, Translation mode, Mushaf mode). Visitor mode: Read.
Audience: Bengali-first daily readers, learners and listeners; phones on slow networks, long sessions at night.
Job: continue where you stopped in one tap, read comfortably in Arabic/Bengali/English, turn mushaf pages like a book, listen and follow.
Constraints: Arabic text is never cropped, animated for show or overlapped by ornament; lang/dir on every script; reduced motion respected; Bengali translation only from a licensed edition (none bundled by default).

## Direction contract
THESIS: Old Dhaka's Star Mosque chini-tikri. The frame is a mosaic of broken blue-and-white china in lime-plaster grout; the reading column is the one plain, unglazed wall. Refuses the category default of green-and-gold arabesque around a verse list.
OWN-WORLD: porcelain ground, white paper wall, cobalt ink, deep cobalt, celadon and rose shards, plaster grout; night is cobalt-dark glaze. Canvas-drawn shards in masthead, surah openers, book covers; eight-pointed tara stars as ayah markers; cobalt ribbon for where you stopped; state as glaze brightness, never outlines; 2px tile corners.
STORY: the reader sees their place first, trusts that the Arabic is treated with care, and reads on in their chosen mode without losing position.
FIRST VIEWPORT: mosaic band across the top carrying the name on a white tile; directly below, the Continue ribbon card (surah, ayah, page) as the primary action, beside a jump field that takes 2:255, page or juz; then the surah index as a calm two-column list with Arabic names at the right edge.
FORM: candidate 5 of 7 (Tara Masjid chini-tikri), seed c5335f56. Signature interaction: RTL mushaf spread turning along one curved crease, drag or keys, single page on phones.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
