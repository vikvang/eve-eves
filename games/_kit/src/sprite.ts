import { hexToRgb, type PaletteMap, SWEETIE16 } from "./palette.js";

/**
 * Rasterize an ASCII pixel grid into a PNG data URL for Kaplay loadSprite.
 * Each character maps through paletteMap to a Sweetie-16 index or transparent.
 */
export const spriteFromGrid = (
  grid: string[],
  paletteMap: PaletteMap
): string => {
  const rows = grid.length;
  const cols = Math.max(0, ...grid.map((r) => r.length));
  if (rows === 0 || cols === 0) {
    throw new Error("spriteFromGrid: empty grid");
  }

  const scale = 1;
  const w = cols * scale;
  const h = rows * scale;
  // Build raw RGBA and encode as uncompressed PNG
  const rgba = new Uint8ClampedArray(w * h * 4);

  for (let y = 0; y < rows; y++) {
    const row = grid[y] ?? "";
    for (let x = 0; x < cols; x++) {
      const ch = row[x] ?? " ";
      const mapped = paletteMap[ch] ?? "transparent";
      const i = (y * w + x) * 4;
      if (mapped === "transparent") {
        rgba[i] = 0;
        rgba[i + 1] = 0;
        rgba[i + 2] = 0;
        rgba[i + 3] = 0;
      } else {
        const [r, g, b] = hexToRgb(SWEETIE16[mapped]);
        rgba[i] = r;
        rgba[i + 1] = g;
        rgba[i + 2] = b;
        rgba[i + 3] = 255;
      }
    }
  }

  return rgbaToPngDataUrl(rgba, w, h);
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

const crc32 = (data: Uint8Array): number => {
  let c = 0xff_ff_ff_ff;
  for (const byte of data) {
    c = crcTable[(c ^ byte) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xff_ff_ff_ff) >>> 0;
};

const u32 = (n: number): Uint8Array => {
  const b = new Uint8Array(4);
  b[0] = (n >>> 24) & 0xff;
  b[1] = (n >>> 16) & 0xff;
  b[2] = (n >>> 8) & 0xff;
  b[3] = n & 0xff;
  return b;
};

const chunk = (type: string, data: Uint8Array): Uint8Array => {
  const typeBytes = new TextEncoder().encode(type);
  const len = u32(data.length);
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes, 0);
  body.set(data, typeBytes.length);
  const crc = u32(crc32(body));
  const out = new Uint8Array(4 + body.length + 4);
  out.set(len, 0);
  out.set(body, 4);
  out.set(crc, 4 + body.length);
  return out;
};

/** Minimal uncompressed PNG encoder (no external deps). */
const rgbaToPngDataUrl = (
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): string => {
  // IHDR
  const ihdr = new Uint8Array(13);
  ihdr.set(u32(width), 0);
  ihdr.set(u32(height), 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Raw image data with filter byte 0 per row, then zlib-wrap as store blocks
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // none filter
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), rowStart + 1);
  }

  const zlib = deflateStore(raw);
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib),
    chunk("IEND", new Uint8Array(0)),
  ];
  let total = 0;
  for (const p of parts) {
    total += p.length;
  }
  const png = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    png.set(p, off);
    off += p.length;
  }
  return `data:image/png;base64,${bytesToBase64(png)}`;
};

/** zlib wrapper around uncompressed deflate store blocks. */
const deflateStore = (data: Uint8Array): Uint8Array => {
  const blocks: Uint8Array[] = [];
  const max = 65_535;
  let offset = 0;
  while (offset < data.length) {
    const end = Math.min(offset + max, data.length);
    const len = end - offset;
    const final = end >= data.length ? 1 : 0;
    const header = new Uint8Array(5);
    header[0] = final; // BFINAL + BTYPE=00
    header[1] = len & 0xff;
    header[2] = (len >> 8) & 0xff;
    header[3] = ~len & 0xff;
    header[4] = (~len >> 8) & 0xff;
    blocks.push(header, data.subarray(offset, end));
    offset = end;
  }
  if (data.length === 0) {
    blocks.push(new Uint8Array([1, 0, 0, 255, 255]));
  }

  const adler = adler32(data);
  let size = 2 + 4; // zlib header + adler
  for (const b of blocks) {
    size += b.length;
  }
  const out = new Uint8Array(size);
  out[0] = 0x78;
  out[1] = 0x01;
  let o = 2;
  for (const b of blocks) {
    out.set(b, o);
    o += b.length;
  }
  out.set(u32(adler), o);
  return out;
};

const adler32 = (data: Uint8Array): number => {
  let a = 1;
  let b = 0;
  for (const byte of data) {
    a = (a + byte) % 65_521;
    b = (b + a) % 65_521;
  }
  return ((b << 16) | a) >>> 0;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  // Node fallback without relying on Buffer types
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const triplet = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    out += chars[(triplet >> 18) & 63];
    out += chars[(triplet >> 12) & 63];
    out += b === undefined ? "=" : chars[(triplet >> 6) & 63];
    out += c === undefined ? "=" : chars[triplet & 63];
  }
  return out;
};
