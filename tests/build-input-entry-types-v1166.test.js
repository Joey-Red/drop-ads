import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/build-input-discovery.mjs", import.meta.url), "utf8");

test("M1166 classifies every discovered child from fresh lstat metadata", () => {
  assert.match(source, /async function classifyFreshEntry\(path\)/);
  assert.match(source, /const stat = await lstat\(path\)/);
  assert.match(source, /stat\.isSymbolicLink\(\)/);
  assert.match(source, /stat\.isDirectory\(\)/);
  assert.match(source, /stat\.isFile\(\)/);
  assert.match(source, /const classified = await classifyFreshEntry\(path\)/);
  assert.match(source, /classified\.type === "directory"/);
  assert.doesNotMatch(source, /entry\.isDirectory\(\)/);
  assert.doesNotMatch(source, /entry\.isFile\(\)/);
  assert.doesNotMatch(source, /entry\.isSymbolicLink\(\)/);
});
