// Renders app icons and splash images from public/logo.svg (the logo mark).
// Usage: node scripts/make-app-assets.mjs && npx capacitor-assets generate --android
import sharp from "sharp";
import { readFileSync } from "node:fs";

const mark = readFileSync("public/logo.svg");
const MINT = "#cdeee8"; // logo background colour
const DARK = "#0d2426"; // dark-mode splash background

const square = (size, background) => sharp({ create: { width: size, height: size, channels: 4, background } });
// Logo mark scaled to `width`, keeping its proportions.
const markPng = (width) => sharp(mark, { density: 600 }).resize({ width }).png().toBuffer();

// Full icon (legacy launchers, web): mark centred on mint with rounded corners.
async function fullIcon(size, rounded = true) {
  const radius = Math.round(size * 0.22);
  const bg = rounded
    ? Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${MINT}"/></svg>`)
    : await square(size, MINT).png().toBuffer();
  return sharp(bg).composite([{ input: await markPng(Math.round(size * 0.66)), gravity: "center" }]).png().toBuffer();
}

await sharp(await fullIcon(1024, false)).toFile("assets/icon-only.png");
await square(1024, MINT).png().toFile("assets/icon-background.png");
await square(1024, { r: 0, g: 0, b: 0, alpha: 0 }).composite([{ input: await markPng(560), gravity: "center" }]).png().toFile("assets/icon-foreground.png");
await square(2732, MINT).composite([{ input: await markPng(640), gravity: "center" }]).png().toFile("assets/splash.png");
await square(2732, DARK).composite([{ input: await markPng(640), gravity: "center" }]).png().toFile("assets/splash-dark.png");

await sharp(await fullIcon(192)).toFile("public/icon-192.png");
await sharp(await fullIcon(512)).toFile("public/icon-512.png");
await sharp(await fullIcon(180, false)).toFile("public/apple-touch-icon.png");
await sharp(await fullIcon(64)).toFile("public/favicon.png");
console.log("assets written");
