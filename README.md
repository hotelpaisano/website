# Hotel Paisano

Standalone one-page implementation of the Paper file Bright glacier.

## Run locally

From this folder, run:

    python3 -m http.server 4173

Then open http://127.0.0.1:4173.

## Implementation notes

- Paper exports are preserved locally for the top wordmark, bottom crest, and floorplan node `5N-1`; the six Paper image fills are also local.
- The page is intentionally one document: notice, introduction, archive gallery, and footer all live in index.html.
- The archive gallery uses the Paper proportions as its resting state.
- Hovering or focusing an image expands an anchored overlay symmetrically from its center point to 2.115× the resting height while the row stays fixed. The archive metadata remains below the row. On touch devices, tap an image to pin the state; press Escape to clear it.
- The desktop header shares one bottom baseline for the address, wordmark, and contact link. At phone widths the logo scales down, the header stacks cleanly, and the gallery remains visible in a horizontal scroller without hover expansion.
- The serif and script families match the font families reported by Paper, with fallbacks for offline viewing.
