// Renders app icons and splash images from public/logo.svg.
// Usage: node scripts/make-app-assets.mjs && npx capacitor-assets generate --android
import sharp from "sharp";
import { readFileSync } from "node:fs";

const logo = readFileSync("public/logo.svg", "utf8");
// Adaptive-icon foreground: the logo without its rounded background, so
// Android can place it on the brand colour in any icon shape.
const glyph = logo
  .replace(/<rect width="512" height="512" rx="116" fill="url\(#bg\)"\/>/, "")
  .replace('viewBox="0 0 512 512"', 'viewBox="60 60 392 392"');

const brand = "#0f5a47";
const square = (size, background) => sharp({ create: { width: size, height: size, channels: 4, background } });
const render = (svg, size) => sharp(Buffer.from(svg), { density: 400 }).resize(size, size).png().toBuffer();

await sharp(await render(logo, 1024)).toFile("assets/icon-only.png");
await square(1024, brand).png().toFile("assets/icon-background.png");
await square(1024, { r: 0, g: 0, b: 0, alpha: 0 }).composite([{ input: await render(glyph, 620), gravity: "center" }]).png().toFile("assets/icon-foreground.png");
const splashLogo = await render(logo, 560);
for (const name of ["splash.png", "splash-dark.png"]) {
  await square(2732, brand).composite([{ input: splashLogo, gravity: "center" }]).png().toFile(`assets/${name}`);
}
// Web app icons (installable web app / home-screen shortcut).
await sharp(await render(logo, 192)).toFile("public/icon-192.png");
await sharp(await render(logo, 512)).toFile("public/icon-512.png");
await sharp(await render(logo, 180)).toFile("public/apple-touch-icon.png");
console.log("assets written");
