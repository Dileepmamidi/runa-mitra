import { fileURLToPath } from "node:url";

/** @type {import('tailwindcss').Config} */

// Runa Mitra design tokens. Every colour is a CSS variable (defined for light
// and dark themes in src/styles.css), so all screens follow the theme.
// brand = logo teal, amber = logo orange. Older names (leaf, soil, marigold,
// danger, warning) are aliases so any remaining screen still matches.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (name, steps) => Object.fromEntries(steps.map((s) => [s, v(`${name}-${s}`)]));

const brand = scale("brand", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
const amber = scale("amber", [50, 100, 200, 500, 600, 700, 800]);
const rose = scale("rose", [50, 100, 200, 500, 600, 700, 800]);
const info = scale("info", [50, 100, 800, 900]);

export default {
  darkMode: "class",
  // Absolute paths so scanning works whatever folder the build starts from.
  content: [
    fileURLToPath(new URL("./index.html", import.meta.url)),
    fileURLToPath(new URL("./src/**/*.{js,jsx}", import.meta.url))
  ],
  theme: {
    extend: {
      colors: {
        brand,
        amber,
        rose,
        sky: info,
        surface: v("surface"),
        canvas: v("canvas"),
        line: v("line"),
        ink: { DEFAULT: v("ink"), soft: v("ink-soft"), muted: v("ink-muted") },
        hero: { from: v("hero-from"), to: v("hero-to") },
        // legacy aliases
        leaf: brand,
        soil: { 50: v("canvas"), 100: v("line"), 500: v("ink-muted") },
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
        soft: "0 1px 2px rgb(var(--shadow) / 0.05), 0 6px 20px rgb(var(--shadow) / 0.07)",
        lift: "0 12px 34px rgb(var(--shadow) / 0.18)",
        bar: "0 -1px 0 rgb(var(--line)), 0 -10px 30px rgb(var(--shadow) / 0.06)"
      },
      fontFamily: {
        sans: ["Nunito Variable", "Noto Sans Telugu Variable", "system-ui", "sans-serif"]
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "none" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(0.96)" }, "100%": { opacity: "1", transform: "none" } },
        pop: { "0%": { transform: "scale(0.9)" }, "60%": { transform: "scale(1.04)" }, "100%": { transform: "scale(1)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } }
      },
      animation: {
        "fade-up": "fade-up 420ms cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in 300ms ease-out both",
        "scale-in": "scale-in 320ms cubic-bezier(.2,.7,.2,1) both",
        pop: "pop 360ms cubic-bezier(.2,.7,.2,1) both",
        shimmer: "shimmer 2.4s linear infinite",
        float: "float 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
