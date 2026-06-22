---
phase: 22-extension-icon
plan: 01
subsystem: infra
tags: [png, icons, chrome-extension, node-builtin, zlib, pixel-art]

# Dependency graph
requires: []
provides:
  - "scripts/generate-icons.js — ES module PNG generator using only Node.js built-ins"
  - "public/icons/icon-16.png — valid 16x16 RGBA PNG with blue-500 background and white checkmark"
  - "public/icons/icon-32.png — valid 32x32 RGBA PNG"
  - "public/icons/icon-48.png — valid 48x48 RGBA PNG"
  - "public/icons/icon-128.png — valid 128x128 RGBA PNG"
  - "package.json icons script — reproducible icon generation via npm run icons"
affects: [chrome-extension-build, manifest, public-assets]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Node.js built-in PNG encoding: zlib.deflateSync + CRC32 lookup table + RGBA scanlines with filter byte 0"
    - "Nearest-neighbor scaling: integer scale factors (x1/x2/x3/x8) from 16px base to all icon sizes"

key-files:
  created:
    - scripts/generate-icons.js
    - public/icons/icon-16.png
    - public/icons/icon-32.png
    - public/icons/icon-48.png
    - public/icons/icon-128.png
  modified:
    - package.json

key-decisions:
  - "Use Node.js built-in modules only (zlib, fs, path, url) — no npm dependencies"
  - "CRC32 via 256-entry reflected-polynomial lookup table (0xEDB88320)"
  - "Nearest-neighbor scaling from a 16x16 base checkmark pattern (x1/x2/x3/x8)"
  - "Commit generated PNGs alongside the generator script for reproducibility"
  - "manifest.json left unchanged — paths already correct"

patterns-established:
  - "PNG generation script: ES module at scripts/ using built-in zlib deflateSync for IDAT compression"

requirements-completed:
  - EXT-01

# Metrics
duration: 2min
completed: 2026-06-22
---

# Phase 22 Plan 01: Extension Icon Summary

**Node.js built-in PNG generator produces four RGBA extension icons (16/32/48/128px) with blue-500 background and nearest-neighbor-scaled white checkmark — no npm dependencies**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-22T09:45:59Z
- **Completed:** 2026-06-22T09:47:51Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `scripts/generate-icons.js` as a zero-dependency ES module that encodes valid RGBA PNGs from raw pixel arrays using `zlib.deflateSync`, CRC32 lookup table, and PNG spec chunk format
- Generated four correctly-sized PNGs (16x16, 32x32, 48x48, 128x128) with solid blue-500 (#3b82f6) background and pixel-art white checkmark motif scaled via nearest-neighbor
- Added `"icons": "node scripts/generate-icons.js"` to `package.json` scripts for reproducible regeneration
- All 4055 existing tests pass — no regressions

## Task Commits

1. **Task 1+2: Write generate-icons.js, update package.json, generate and verify PNGs** - `a857044` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `scripts/generate-icons.js` — ES module PNG encoder: CRC32 table, chunk encoder, makePNG(), makeIconPixels() with checkmark pixel art
- `package.json` — Added `"icons": "node scripts/generate-icons.js"` script entry
- `public/icons/icon-16.png` — 16x16 RGBA PNG, 112 bytes (was 66-byte 1x1 placeholder)
- `public/icons/icon-32.png` — 32x32 RGBA PNG, 137 bytes (was 66-byte 1x1 placeholder)
- `public/icons/icon-48.png` — 48x48 RGBA PNG, 172 bytes (was 66-byte 1x1 placeholder)
- `public/icons/icon-128.png` — 128x128 RGBA PNG, 372 bytes (was 66-byte 1x1 placeholder)

## Decisions Made

- Used a 256-entry CRC32 lookup table with polynomial 0xEDB88320 (reflected-input style) — standard PNG CRC approach
- Defined checkmark as 16 white-pixel coordinates on a 16x16 grid, scaled to larger sizes via nearest-neighbor integer scale factors (x1, x2, x3, x8)
- No border-radius rounding — square geometry per D-07 (discretion item, omitted for simplicity)
- No external npm packages — complies with D-01 (only zlib, fs, path, url)

## Deviations from Plan

**File size note:** The plan's "expected approximate sizes" (>200B, >400B, >700B, >3000B) were not met because the solid blue-500 background compresses extremely efficiently with zlib deflate. Actual sizes (112B, 137B, 172B, 372B) are valid — all substantially larger than the 66-byte placeholders and confirmed correct by binary header check. This is not a bug; it reflects the high compressibility of uniform-color pixel data.

Otherwise, none — plan executed exactly as written.

## Issues Encountered

None — script ran correctly on first attempt. All four PNG headers validated (correct PNG signature + exact dimensions). Pixel-content spot-check confirmed blue-500 background at (0,0) and white checkmark pixel at (9,3) for the 16x16 icon.

## User Setup Required

None — no external service configuration required. Run `npm run icons` to regenerate icon PNGs if needed.

## Threat Flags

None — script writes only to `public/icons/` using hardcoded pixel arrays with no user input. No new network endpoints, auth paths, or external service surface introduced.

## Known Stubs

None — all four icon files are complete RGBA PNGs rendered to the correct dimensions with blue-500 background and white checkmark motif.

## Next Phase Readiness

- Chrome extension will display the Interviewer Checklist icon in the toolbar, extensions manager, and chrome://extensions once rebuilt with `vite build`
- `@crxjs/vite-plugin` picks up `public/icons/` assets automatically — no Vite config changes needed
- No blockers

---
*Phase: 22-extension-icon*
*Completed: 2026-06-22*
