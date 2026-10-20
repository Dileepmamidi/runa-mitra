import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const root = fileURLToPath(new URL(".", import.meta.url));

// In development, serve the Vercel functions in /api from the Vite server so
// payments can be tested locally. Server-only variables (RAZORPAY_*,
// FIREBASE_SERVICE_ACCOUNT, *_EMULATOR_HOST) are read from .env files here and
// are never exposed to the app bundle (only VITE_* variables are).
function localApi(mode) {
  return {
    name: "runa-local-api",
    configureServer(server) {
      const env = loadEnv(mode, root, "");
      for (const [key, value] of Object.entries(env)) {
        if (!key.startsWith("VITE_") && process.env[key] === undefined) process.env[key] = value;
      }
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const route = req.url.split("?")[0].replace(/^\/api\//, "");
        const file = `${root}api/${route}.js`;
        if (!/^[a-z0-9/-]+$/i.test(route) || route.includes("_lib") || !existsSync(file)) return next();
        try {
          const mod = await server.ssrLoadModule(file);
          await mod.default(req, res);
        } catch (err) {
          console.error(err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Server error." }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), localApi(mode)],
  server: {
    port: 5173
  }
}));
