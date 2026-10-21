import { fileURLToPath } from "node:url";

/** @type {import('tailwindcss').Config} */

// Runa Mitra design tokens. "brand" is the primary colour; the older names
// (leaf, soil, marigold, danger, warning) are kept as aliases so any screen
// that still uses them matches the new look.
const brand = {
  50: "#effaf6",
  100: "#d7f2e7",
  200: "#b0e4d0",
  300: "#7ccfb3",
  400: "#43b190",
  500: "#1f9474",
  600: "#13775e",
  700: "#105f4c",
  800: "#0f4c3e",
  900: "#0c3f34",
  950: "#062520"
};
const amber = {
  50: "#fff8eb",
  100: "#feecc7",
  200: "#fdd68a",
  500: "#e59a0b",
  600: "#c47a06",
  700: "#9b5a09",
  800: "#7d470e"
};
const rose = {
  50: "#fff1f1",
  100: "#ffe0e0",
  200: "#ffc6c6",
  500: "#e5484d",
  600: "#cc2f35",
  700: "#a8232a",
  800: "#8b2127"
};

export default {
  // Absolute paths so scanning works whatever folder the build starts from.
  content: [
    fileURLToPath(new URL("./index.html", import.meta.url)),
    fileURLToPath(new URL("./src/**/*.{js,jsx}", import.meta.url))
  ],
  theme: {
    extend: {
      colors: {
        brand,
        canvas: "#f5f6f3",
        line: "#e6e8e3",
        ink: { DEFAULT: "#15201c", soft: "#4b5852", muted: "#7a8580" },
        amber,
        rose,
        // legacy aliases
        leaf: brand,
        soil: { 50: "#f5f6f3", 100: "#eceee9", 500: "#7a6a52" },
        marigold: amber,
        warning: amber,
        danger: rose
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 40, 32, 0.04), 0 4px 16px rgba(16, 40, 32, 0.06)",
        lift: "0 8px 30px rgba(16, 40, 32, 0.12)",
        bar: "0 -1px 0 #e6e8e3, 0 -8px 24px rgba(16, 40, 32, 0.05)"
      },
      fontFamily: {
        sans: ["Inter Variable", "Noto Sans Telugu Variable", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
