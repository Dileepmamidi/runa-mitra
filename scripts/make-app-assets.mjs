// Renders the Android/iOS icon and splash source images from the logo.
// Usage: node scripts/make-app-assets.mjs && npx capacitor-assets generate --android
import sharp from "sharp";
import { readFileSync } from "node:fs";

const brand = "#13775e";
const logo = readFileSync("public/logo.svg");
// The logo's inner mark without its rounded green background.
const glyph = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <path d="M35 31h54a11 11 0 0 1 11 11v58H35a11 11 0 0 1-11-11V42a11 11 0 0 1 11-11Z" fill="#ffffff"/>
  <path d="M41 50h38M41 67h48M41 84h31" stroke="${brand}" stroke-width="8" stroke-linecap="round"/>
  <circle cx="93" cy="89" r="20" fill="#e59a0b"/>
  <path d="M82 89h22M93 78v22" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
</svg>`;

const square = (size, color) => sharp({ create: { width: size, height: size, channels: 4, background: color } });

await sharp(logo, { density: 600 }).resize(1024, 1024).png().toFile("assets/icon-only.png");
await square(1024, brand).png().toFile("assets/icon-background.png");
// Adaptive icon foreground: mark inside the central safe zone.
const mark = await sharp(Buffer.from(glyph), { density: 600 }).resize(600, 600).png().toBuffer();
await square(1024, { r: 0, g: 0, b: 0, alpha: 0 }).composite([{ input: mark, gravity: "center" }]).png().toFile("assets/icon-foreground.png");
// Splash: logo centred on the brand colour.
const splashLogo = await sharp(logo, { density: 600 }).resize(560, 560).png().toBuffer();
for (const name of ["splash.png", "splash-dark.png"]) {
  await square(2732, brand).composite([{ input: splashLogo, gravity: "center" }]).png().toFile(`assets/${name}`);
}
console.log("assets/ written");
