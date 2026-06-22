# Phase 22: Extension Icon — Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the four 1×1 pixel placeholder PNGs in `public/icons/` with real, correctly-sized icon assets:
- `icon-16.png` — Chrome toolbar button (16×16)
- `icon-32.png` — Chrome toolbar button (HiDPI, 32×32)
- `icon-48.png` — Extensions manager list (48×48)
- `icon-128.png` — Chrome Web Store / chrome://extensions detail (128×128)

The `manifest.json` already has correct icon paths — no manifest changes needed.
No new features. No UI changes. No test changes.

</domain>

<decisions>
## Implementation Decisions

### Icon Generation Method

- **D-01**: Use a one-shot Node.js script (`scripts/generate-icons.js`) that generates all four PNG files at build time. No new npm dependencies — use only Node.js built-ins (`zlib`, `fs`, `path`).
- **D-02**: The script encodes raw RGBA pixel arrays into valid PNG files using the PNG specification: 8-byte signature + IHDR chunk + IDAT chunk (zlib-compressed scanlines with filter byte 0) + IEND chunk. All CRC32 values computed using the standard polynomial `0xEDB88320`.
- **D-03**: The script is placed at `scripts/generate-icons.js` (create the directory). It is run once to generate the PNGs, which are committed to the repo. The script itself is committed for reproducibility.
- **D-04**: Add a `"icons"` script to `package.json`: `"icons": "node scripts/generate-icons.js"` so it can be re-run.

### Icon Visual Design

- **D-05**: Icon design: solid blue-500 background (`#3b82f6`) with a white checklist motif — three rows of a horizontal line representing scored questions, matching the app's checklist-based purpose.
- **D-06**: At 16×16 and 32×32: simplified — a blue square with a single white thick checkmark (pixel art). At 48×48 and 128×128: same checkmark scaled proportionally with 1px/2px padding respectively.
- **D-07**: All icons use square geometry (no circular clip) — Chrome renders them as-is in the toolbar. Rounded corners (4px radius at 128px scale) are optional polish but not required.
- **D-08**: Background color: `#3b82f6` (blue-500, matching the app accent). Foreground: `#ffffff`. No transparency in background — solid fill.

### Pixel Designs

**16×16 — white checkmark on blue:**
```
Background: all pixels #3b82f6
Checkmark (white pixels at rows/cols, 0-indexed):
  Row 9,  col 3
  Row 10, cols 3-4
  Row 11, cols 4-5
  Row 8,  col 10
  Row 9,  cols 9-10
  Row 10, cols 7-8
  Row 11, cols 5-7
  (thick descending-then-ascending checkmark strokes)
```
Use a 2-pixel wide stroke checkmark scaled per size.

**32×32, 48×48, 128×128:** Scale the 16×16 design proportionally using nearest-neighbor (integer scale factors: ×2, ×3, ×8).

### File Outputs

- **D-09**: Script writes directly to `public/icons/icon-{16,32,48,128}.png`. It overwrites existing placeholder files.
- **D-10**: Script should `console.log` confirmation for each file written.

### No Manifest Changes

- **D-11**: `manifest.json` already declares all four icon paths correctly under both `"icons"` and `"action.default_icon"`. No manifest edits needed.

### Claude's Discretion

- Exact pixel arrangement of the checkmark within the bounding box.
- Whether to add border-radius corner rounding at 128px.
- The CRC32 implementation (table-based or inline).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fix Targets
- `public/icons/icon-16.png` — currently 1×1 placeholder; overwrite with 16×16 RGBA PNG
- `public/icons/icon-32.png` — currently 1×1 placeholder; overwrite with 32×32 RGBA PNG
- `public/icons/icon-48.png` — currently 1×1 placeholder; overwrite with 48×48 RGBA PNG
- `public/icons/icon-128.png` — currently 1×1 placeholder; overwrite with 128×128 RGBA PNG
- `manifest.json` — read-only; paths already correct
- `scripts/generate-icons.js` — create this file
- `package.json` — add `"icons"` script entry

### PNG Format Reference (for executor)
A minimal PNG file structure:
1. Signature: `[0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]`
2. IHDR chunk: 4-byte length (13) + `IHDR` + width(4B) + height(4B) + bitDepth(1B=8) + colorType(1B=6 for RGBA) + compression(0) + filter(0) + interlace(0) + CRC32
3. IDAT chunk: 4-byte length + `IDAT` + zlib.deflate(scanlines) + CRC32
   - Scanlines: for each row, prepend filter byte `0x00` then 4 bytes per pixel (R,G,B,A)
4. IEND chunk: 4-byte length (0) + `IEND` + CRC32 (`0xAE426082`)

CRC32 of `IEND` (zero-length): `0xAE426082` (constant, can be hardcoded).

</canonical_refs>

<code_context>
## Existing Code Insights

### What Exists
- `public/icons/` directory with four 1×1 placeholder PNGs (confirmed via `file` command)
- `manifest.json` with correct icon paths already wired under `"icons"` and `"action.default_icon"`
- No existing icon generation script

### No Test Impact
- There are no tests for icon files.
- No source code imports the icon files.
- Replacing the PNG files does not affect any existing test.

### Build Impact
- `@crxjs/vite-plugin` bundles `public/` assets; replacing PNGs in `public/icons/` is picked up automatically on next build.
- No vite config changes needed.

</code_context>

<specifics>
## Specific Ideas

### generate-icons.js skeleton
```js
#!/usr/bin/env node
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');

// CRC32 table
const crc32Table = (() => { /* standard polynomial */ })();
function crc32(buf) { /* standard implementation */ }

function encodeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePNG(size, pixels) {
  // pixels: Uint8Array of size*size*4 (RGBA)
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; ihdrData[9] = 6; // RGBA
  const scanlines = [];
  for (let y = 0; y < size; y++) {
    scanlines.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      scanlines.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
    }
  }
  const idat = deflateSync(Buffer.from(scanlines));
  return Buffer.concat([sig, encodeChunk('IHDR', ihdrData), encodeChunk('IDAT', idat), encodeChunk('IEND', Buffer.alloc(0))]);
}

function makeIconPixels(size) {
  const BG = [0x3b, 0x82, 0xf6, 0xff]; // blue-500
  const FG = [0xff, 0xff, 0xff, 0xff]; // white
  const pixels = new Uint8Array(size * size * 4);
  // Fill background
  for (let i = 0; i < size * size; i++) pixels.set(BG, i * 4);
  // Draw checkmark scaled to size
  // ... pixel-art checkmark logic ...
  return pixels;
}

for (const size of [16, 32, 48, 128]) {
  const pixels = makeIconPixels(size);
  const png = makePNG(size, pixels);
  const outPath = join(ICONS_DIR, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`✓ ${outPath} (${png.length} bytes)`);
}
```

</specifics>

<deferred>
## Deferred Ideas

- Animated icon (not supported by Chrome for extension icons)
- SVG source file (useful but not required — the PNG generator script serves as the source of truth)

</deferred>

---

*Phase: 22-Extension-Icon*
*Context gathered: 2026-06-22*
