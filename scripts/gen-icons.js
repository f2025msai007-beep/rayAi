import fs from 'fs';
import zlib from 'zlib';

function createSolidPng(width, height, r, g, b, a = 255) {
  // Construct a valid PNG with uncompressed/deflated raw RGBA data
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let n = 0; n < buf.length; n++) {
      c ^= buf[n];
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = chunk('IHDR', ihdr);

  // Raw image scanlines
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Generate a stylish dark gradient background with cyan/purple center accent
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxR = width / 2;
      const isGlassesBand = Math.abs(dy) < height * 0.15 && Math.abs(dx) < width * 0.38;
      const isLensLeft = Math.sqrt((dx + width * 0.18) ** 2 + dy ** 2) < width * 0.16;
      const isLensRight = Math.sqrt((dx - width * 0.18) ** 2 + dy ** 2) < width * 0.16;

      if (isLensLeft || isLensRight) {
        // Lens cyan/purple tint
        rawData[pxOffset] = isLensLeft ? 56 : 168; // R
        rawData[pxOffset + 1] = isLensLeft ? 189 : 85; // G
        rawData[pxOffset + 2] = 248; // B
        rawData[pxOffset + 3] = 255;
      } else if (isGlassesBand) {
        // Glasses frame dark accent
        rawData[pxOffset] = 30;
        rawData[pxOffset + 1] = 41;
        rawData[pxOffset + 2] = 59;
        rawData[pxOffset + 3] = 255;
      } else {
        // Deep indigo gradient background
        const factor = Math.min(1, dist / maxR);
        rawData[pxOffset] = Math.round(9 + (30 - 9) * factor);
        rawData[pxOffset + 1] = Math.round(13 + (27 - 13) * factor);
        rawData[pxOffset + 2] = Math.round(22 + (75 - 22) * factor);
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idatChunk = chunk('IDAT', deflated);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pwa192 = createSolidPng(192, 192, 15, 23, 42);
const pwa512 = createSolidPng(512, 512, 15, 23, 42);
const appleIcon = createSolidPng(180, 180, 15, 23, 42);

fs.writeFileSync('./public/pwa-192x192.png', pwa192);
fs.writeFileSync('./public/pwa-512x512.png', pwa512);
fs.writeFileSync('./public/pwa-maskable-512x512.png', pwa512);
fs.writeFileSync('./public/apple-touch-icon.png', appleIcon);
console.log('Successfully generated PWA and Apple Touch PNG icons.');
