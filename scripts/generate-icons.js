#!/usr/bin/env node
// generate-icons.js — ES module (package.json has "type": "module")
// Generates four PNG icon files for the Chrome extension using only Node.js built-ins.
// No npm packages required.

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');

// Ensure output directory exists
mkdirSync(ICONS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// CRC32 — standard reflected polynomial 0xEDB88320
// ---------------------------------------------------------------------------
const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let val = i;
    for (let j = 0; j < 8; j++) {
      val = (val & 1) ? ((val >>> 1) ^ 0xEDB88320) : (val >>> 1);
    }
    table[i] = val;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xFF];
  }
  // Return as signed 32-bit integer
  return (crc ^ 0xFFFFFFFF) | 0;
}

// ---------------------------------------------------------------------------
// PNG chunk encoder
// ---------------------------------------------------------------------------
function encodeChunk(typeStr, data) {
  const typeBuf = Buffer.from(typeStr, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// ---------------------------------------------------------------------------
// PNG encoder — 8-bit RGBA (color type 6)
// ---------------------------------------------------------------------------
function makePNG(size, pixels) {
  // PNG signature
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR: width(4) height(4) bitDepth(1=8) colorType(1=6 RGBA) compress(1=0) filter(1=0) interlace(1=0)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method

  // Build scanlines: filter byte (0x00) + 4 bytes per pixel per row
  const scanlineBuf = Buffer.alloc(size * (1 + size * 4));
  let offset = 0;
  for (let y = 0; y < size; y++) {
    scanlineBuf[offset++] = 0x00; // filter type: None
    for (let x = 0; x < size; x++) {
      const pi = (y * size + x) * 4;
      scanlineBuf[offset++] = pixels[pi];     // R
      scanlineBuf[offset++] = pixels[pi + 1]; // G
      scanlineBuf[offset++] = pixels[pi + 2]; // B
      scanlineBuf[offset++] = pixels[pi + 3]; // A
    }
  }

  // IDAT: zlib-compressed scanlines
  const idatData = deflateSync(scanlineBuf);

  // IEND: zero-length, CRC is always 0xAE426082
  const iendChunk = encodeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, encodeChunk('IHDR', ihdrData), encodeChunk('IDAT', idatData), iendChunk]);
}

// ---------------------------------------------------------------------------
// Icon pixel generation — blue-500 background with white checkmark
// ---------------------------------------------------------------------------

// Base 16×16 checkmark pixel coordinates (0-indexed row, col)
// Thick L-shaped checkmark: descending left stroke then ascending right stroke
const BASE_CHECKMARK_16 = new Set([
  // Left (descending) stroke — bottom-left part of checkmark
  '9,3',
  '10,3', '10,4',
  '11,4', '11,5',
  // Right (ascending) stroke — bottom-right to top-right part of checkmark
  '11,5', '11,6',
  '10,6', '10,7',
  '9,7',  '9,8',
  '8,8',  '8,9',
  '7,9',  '7,10',
  '6,10', '6,11',
]);

function makeIconPixels(size) {
  const BG = [0x3b, 0x82, 0xf6, 0xff]; // blue-500
  const FG = [0xff, 0xff, 0xff, 0xff]; // white

  const pixels = new Uint8Array(size * size * 4);

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels.set(BG, i * 4);
  }

  // Scale factor (exact integers: 16→×1, 32→×2, 48→×3, 128→×8)
  const scale = size / 16;

  // Draw scaled checkmark using nearest-neighbor (each base pixel → scale×scale block)
  for (const coord of BASE_CHECKMARK_16) {
    const [row, col] = coord.split(',').map(Number);
    for (let dy = 0; dy < scale; dy++) {
      for (let dx = 0; dx < scale; dx++) {
        const pr = row * scale + dy;
        const pc = col * scale + dx;
        if (pr >= 0 && pr < size && pc >= 0 && pc < size) {
          const idx = (pr * size + pc) * 4;
          pixels.set(FG, idx);
        }
      }
    }
  }

  return pixels;
}

// ---------------------------------------------------------------------------
// Main: generate all four icon sizes
// ---------------------------------------------------------------------------
for (const size of [16, 32, 48, 128]) {
  const pixels = makeIconPixels(size);
  const png = makePNG(size, pixels);
  const outPath = join(ICONS_DIR, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`Written: ${outPath} (${png.length} bytes)`);
}
