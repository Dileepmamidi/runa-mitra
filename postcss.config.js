import { fileURLToPath } from "node:url";

// Resolve the Tailwind config from this folder, not the shell's working directory.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL("./tailwind.config.js", import.meta.url)) },
    autoprefixer: {}
  }
};
