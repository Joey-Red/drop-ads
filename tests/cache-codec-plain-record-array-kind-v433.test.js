import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cache-codec.js", import.meta.url), "utf8");

test("M433 cache plain-record admission contains array-kind and metadata traps", () => {
  assert.match(source, /function plainDataSnapshot\(value\) \{\s*let isArray;[\s\S]*try \{\s*isArray = Array\.isArray\(value\);[\s\S]*prototype = Object\.getPrototypeOf\(value\);[\s\S]*ownKeys = Reflect\.ownKeys\(value\);\s*\} catch \{\s*return null;\s*\}/s);
  assert.match(source, /if \(!value \|\| typeof value !== "object" \|\| isArray\) return null;/);
});

test("M433 cache records remain own enumerable data only", () => {
  assert.match(source, /if \(!descriptor\?\.enumerable \|\| !\("value" in descriptor\)\) return null;/);
});
