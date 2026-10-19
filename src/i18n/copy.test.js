import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Every *.copy.js file must provide the same keys in English and Telugu, so a
// screen never falls back to the other language.
function findCopyFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return findCopyFiles(full);
    return name.endsWith(".copy.js") ? [full] : [];
  });
}

function shape(value, path = "") {
  if (typeof value === "function") return [`${path}()`];
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.keys(value).sort().flatMap((k) => shape(value[k], path ? `${path}.${k}` : k));
  }
  if (Array.isArray(value)) return [`${path}[${value.length}]`];
  return [path];
}

function emptyStrings(value, path = "") {
  if (typeof value === "string") return value.trim() ? [] : [path];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => emptyStrings(v, `${path}.${k}`));
  }
  return [];
}

const files = findCopyFiles("src");

test("copy files exist", () => {
  assert.ok(files.length > 0);
});

for (const file of files) {
  test(`English and Telugu match: ${file}`, async () => {
    const mod = await import(pathToFileURL(join(process.cwd(), file)).href);
    for (const [name, copy] of Object.entries(mod)) {
      assert.ok(copy.en && copy.te, `${name} needs en and te`);
      assert.deepEqual(shape(copy.te), shape(copy.en), `${name}: keys differ`);
      assert.deepEqual(emptyStrings(copy.en), [], `${name}: empty English text`);
      assert.deepEqual(emptyStrings(copy.te), [], `${name}: empty Telugu text`);
    }
  });
}
