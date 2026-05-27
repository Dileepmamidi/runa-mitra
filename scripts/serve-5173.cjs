const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(process.cwd(), "dist");
const port = 5173;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function send(response, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Unable to load Runa Mitra.");
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(content);
  });
}

http
  .createServer((request, response) => {
    const cleanUrl = decodeURIComponent((request.url || "/").split("?")[0]);
    const requested = path.normalize(path.join(root, cleanUrl === "/" ? "index.html" : cleanUrl));
    const safePath = requested.startsWith(root) ? requested : path.join(root, "index.html");

    fs.stat(safePath, (error, stats) => {
      if (!error && stats.isFile()) {
        send(response, safePath);
        return;
      }
      send(response, path.join(root, "index.html"));
    });
  })
  .listen(port, "0.0.0.0", () => {
    fs.writeFileSync("site-ready.txt", `http://localhost:${port}`);
  });

setInterval(() => {}, 60 * 60 * 1000);
