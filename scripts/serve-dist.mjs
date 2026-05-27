import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "dist");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function resolvePath(url) {
  const cleanUrl = decodeURIComponent(url.split("?")[0]);
  const filePath = normalize(join(root, cleanUrl === "/" ? "index.html" : cleanUrl));
  return filePath.startsWith(root) ? filePath : join(root, "index.html");
}

const server = createServer(async (request, response) => {
  try {
    let filePath = resolvePath(request.url || "/");
    let content;

    try {
      content = await readFile(filePath);
    } catch {
      filePath = join(root, "index.html");
      content = await readFile(filePath);
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(content);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Server error");
  }
});

server.listen(port, "0.0.0.0", () => {
  writeFile("preview-server.ready", `http://localhost:${port}`).catch(() => {});
});

setInterval(() => {}, 1 << 30);
