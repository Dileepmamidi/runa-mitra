/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#edf8f2",
          100: "#d5f0e1",
          500: "#24966d",
          600: "#137a5b",
          700: "#0c624a"
        },
        soil: {
          50: "#faf7f0",
          100: "#f2ead9",
          500: "#b17b42"
        },
        marigold: {
          100: "#fff1bd",
          500: "#e9a316"
        },
        danger: {
          50: "#fff1f0",
          500: "#dc3a33"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(30, 63, 45, 0.09)"
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Telugu", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
