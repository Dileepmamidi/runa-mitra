// Shared HTTP helpers for the API functions: CORS for the Android app
// (Capacitor serves the app from https://localhost), JSON replies, auth.
const ALLOWED_ORIGINS = ["https://localhost", "capacitor://localhost", "http://localhost:5173"];

export function applyCors(req, res) {
  const origin = req.headers?.origin;
  const extra = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (origin && (ALLOWED_ORIGINS.includes(origin) || extra.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

/** Returns the Firebase uid from "Authorization: Bearer <ID token>" or throws 401. */
export async function requireUser(req, verifyIdToken) {
  const header = req.headers?.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw Object.assign(new Error("Please sign in again."), { status: 401 });
  try {
    const decoded = await verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw Object.assign(new Error("Please sign in again."), { status: 401 });
  }
}

export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const raw = await readRaw(req);
  return raw ? JSON.parse(raw) : {};
}

export function readRaw(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export function wrap(handler) {
  return async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") return send(res, 204, {});
    if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
    try {
      await handler(req, res);
    } catch (err) {
      const status = err.status || 500;
      if (status >= 500) console.error(err);
      send(res, status, { error: status >= 500 && !err.status ? "Server error." : err.message });
    }
  };
}
