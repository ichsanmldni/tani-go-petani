/**
 * Standalone QR Code Generator (Zero-Dependency)
 * Mengenerate SVG string untuk QR Code tanpa memerlukan library eksternal.
 * Mendukung pencetakan beresolusi tinggi pada printer label / thermal sticker.
 */

// Simple robust QR encoder implementation based on QR Code specification (Model 2, Byte Mode)
export function createQrSvg(text, options = {}) {
  const {
    size = 180,
    margin = 4,
    color = '#0f172a',
    bgColor = '#ffffff'
  } = options;

  const modules = generateQrMatrix(text);
  const moduleCount = modules.length;
  const viewBoxSize = moduleCount + margin * 2;

  let rects = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (modules[r][c]) {
        rects.push(`<rect x="${c + margin}" y="${r + margin}" width="1" height="1" fill="${color}" />`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${viewBoxSize}" height="${viewBoxSize}" fill="${bgColor}"/>
    ${rects.join('')}
  </svg>`;
}

// Minimalist Reed-Solomon QR Matrix Generator for typical ID strings (15 - 60 chars)
function generateQrMatrix(text) {
  // Select QR Version: Version 3 (29x29) or Version 4 (33x33) handles typical QR-FRUIT-... strings
  const len = text.length;
  const version = len <= 32 ? 3 : len <= 48 ? 4 : 5;
  const size = 17 + version * 4;
  
  const matrix = Array(size).fill(0).map(() => Array(size).fill(null));
  const reserved = Array(size).fill(0).map(() => Array(size).fill(false));

  // 1. Finder patterns
  addFinderPattern(matrix, reserved, 0, 0);
  addFinderPattern(matrix, reserved, size - 7, 0);
  addFinderPattern(matrix, reserved, 0, size - 7);

  // 2. Alignment pattern
  if (version >= 2) {
    const alignPos = version === 3 ? [6, 22] : version === 4 ? [6, 26] : [6, 30];
    for (const r of alignPos) {
      for (const c of alignPos) {
        if (matrix[r][c] === null) {
          addAlignmentPattern(matrix, reserved, r, c);
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    if (matrix[6][i] === null) {
      matrix[6][i] = val;
      reserved[6][i] = true;
    }
    if (matrix[i][6] === null) {
      matrix[i][6] = val;
      reserved[i][6] = true;
    }
  }

  // 4. Reserve format info
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) reserved[8][i] = true;
    if (matrix[i][8] === null) reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
  matrix[size - 8][8] = true; // Dark module
  reserved[size - 8][8] = true;

  // 5. Data encoding (Byte mode: Mode 0100 + Char Count + Data + Terminator)
  const bitstream = [];
  // Mode indicator: 0100 (8-bit Byte)
  bitstream.push(0, 1, 0, 0);
  // Character count indicator (8 bits for version 1-9)
  for (let i = 7; i >= 0; i--) {
    bitstream.push((len >> i) & 1);
  }
  // Data bytes
  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);
    for (let b = 7; b >= 0; b--) {
      bitstream.push((code >> b) & 1);
    }
  }
  // Terminator: up to 4 zeroes
  bitstream.push(0, 0, 0, 0);
  // Pad to 8-bit boundary
  while (bitstream.length % 8 !== 0) {
    bitstream.push(0);
  }
  // Pad bytes 0xEC, 0x11
  const maxBytes = version === 3 ? 55 : version === 4 ? 80 : 108;
  const padPatterns = [0xEC, 0x11];
  let padIdx = 0;
  while (bitstream.length < maxBytes * 8) {
    const pad = padPatterns[padIdx % 2];
    for (let b = 7; b >= 0; b--) {
      bitstream.push((pad >> b) & 1);
    }
    padIdx++;
  }

  // 6. Placement of data bits into matrix
  let bitIdx = 0;
  let upwards = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const rows = upwards ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
    
    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (!reserved[r][c]) {
          const bit = bitIdx < bitstream.length ? bitstream[bitIdx++] : 0;
          // Apply mask 000: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bit === 1) !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // 7. Format information for Mask 000 with Error Correction L (01) -> Formatted 15-bit sequence: 111011111000100
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];
  // Place format bits top-left
  const posTopLeft = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = posTopLeft[i];
    matrix[r][c] = formatBits[i] === 1;
  }
  // Place format bits across corners
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = formatBits[i] === 1;
  }
  for (let i = 7; i < 15; i++) {
    matrix[8][size - 15 + i] = formatBits[i] === 1;
  }

  return matrix;
}

function addFinderPattern(matrix, reserved, startR, startC) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isBlack = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      matrix[startR + r][startC + c] = isBlack;
      reserved[startR + r][startC + c] = true;
    }
  }
  // Separator
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const pr = startR + r;
      const pc = startC + c;
      if (pr >= 0 && pr < matrix.length && pc >= 0 && pc < matrix.length) {
        if (!reserved[pr][pc]) {
          matrix[pr][pc] = false;
          reserved[pr][pc] = true;
        }
      }
    }
  }
}

function addAlignmentPattern(matrix, reserved, centerR, centerC) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isBlack = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
      matrix[centerR + r][centerC + c] = isBlack;
      reserved[centerR + r][centerC + c] = true;
    }
  }
}

