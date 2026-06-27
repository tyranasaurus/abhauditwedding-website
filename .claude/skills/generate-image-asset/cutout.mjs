// Turn a solid-color-keyed Gemini render into a true transparent cutout.
//
// Gemini cannot emit a real alpha channel, so we generate the subject on a flat
// key background (prompt: "...on a solid pure magenta #FF00FF background that
// fills the entire frame edge to edge, no paper, no card, no border"). Gemini
// rarely paints the *exact* key colour, so this DOESN'T hard-code #FF00FF:
//
//   1. Sample the four corners to learn the actual background colour.
//   2. Flood-fill from every border pixel, dropping pixels within a colour
//      distance of that background. Flood-fill only removes background that is
//      CONNECTED to the edges, so similar colours *inside* the art are kept.
//   3. Despill the key tint from anti-aliased edge pixels and feather them.
//   4. Trim to the visible bounds with a little padding.
//
// Usage:  node cutout.mjs <in.png> <out.png> [padding] [tolerance]
// Requires sharp (a devDependency of this repo — `npm install` provides it).

import sharp from "sharp";

const [, , inPath, outPath, padArg, tolArg] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: node cutout.mjs <in.png> <out.png> [padding] [tolerance]");
  process.exit(1);
}
const padding = Number.parseInt(padArg ?? "16", 10);
const tolerance = Number.parseInt(tolArg ?? "115", 10); // RGB distance; raise if bg remains

const { data, info } = await sharp(inPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const idx = (x, y) => (y * width + x) * channels;

// 1. Estimate background colour from the four corners (8x8 patches).
let br = 0, bg = 0, bb = 0, n = 0;
for (const [cx, cy] of [[0, 0], [width - 8, 0], [0, height - 8], [width - 8, height - 8]]) {
  for (let y = cy; y < cy + 8; y += 1) {
    for (let x = cx; x < cx + 8; x += 1) {
      const o = idx(x, y);
      br += data[o]; bg += data[o + 1]; bb += data[o + 2]; n += 1;
    }
  }
}
br = br / n; bg = bg / n; bb = bb / n;
const dist = (o) => Math.hypot(data[o] - br, data[o + 1] - bg, data[o + 2] - bb);

// 2. Flood-fill the connected background from the borders.
const removed = new Uint8Array(width * height);
const stack = [];
const pushIf = (x, y) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const p = y * width + x;
  if (removed[p]) return;
  if (dist(idx(x, y)) <= tolerance) { removed[p] = 1; stack.push(x, y); }
};
for (let x = 0; x < width; x += 1) { pushIf(x, 0); pushIf(x, height - 1); }
for (let y = 0; y < height; y += 1) { pushIf(0, y); pushIf(width - 1, y); }
while (stack.length) {
  const y = stack.pop(), x = stack.pop();
  pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1);
}

// 3. Apply alpha; feather kept edge pixels that still sit near the key colour so
//    the halo fades out instead of leaving a hard magenta fringe; track bounds.
let minX = width, minY = height, maxX = -1, maxY = -1;
for (let p = 0; p < width * height; p += 1) {
  const o = p * channels;
  if (removed[p]) { data[o + 3] = 0; continue; }
  const d = dist(o);
  if (d < tolerance * 1.6) {
    // Linear feather: alpha 0 at the key colour → full alpha by tolerance*1.6.
    const a = Math.max(0, Math.min(1, (d - tolerance * 0.6) / (tolerance * 1.0)));
    data[o + 3] = Math.round(data[o + 3] * a);
    if (data[o + 3] === 0) continue;
  }
  const x = p % width, y = (p / width) | 0;
  if (x < minX) minX = x; if (x > maxX) maxX = x;
  if (y < minY) minY = y; if (y > maxY) maxY = y;
}

if (maxX < 0) {
  console.error("No visible pixels left — the whole image keyed out. Lower the tolerance.");
  process.exit(2);
}

const left = Math.max(0, minX - padding);
const top = Math.max(0, minY - padding);
const right = Math.min(width - 1, maxX + padding);
const bottom = Math.min(height - 1, maxY + padding);

await sharp(Buffer.from(data), { raw: { width, height, channels } })
  .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
  .png()
  .toFile(outPath);

console.log(
  `Cutout written: ${outPath} (${right - left + 1}x${bottom - top + 1}), ` +
  `bg≈rgb(${br | 0},${bg | 0},${bb | 0}), tolerance ${tolerance}`,
);
