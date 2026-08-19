import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const landmarks = await readFile(new URL("../src/options/list-filter-landmarks.js", import.meta.url), "utf8");
const listFilter = await readFile(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("Settings list-filter landmarks do not install a second no-match owner", () => {
  assert.doesNotMatch(landmarks, /import\s+["']\.\/list-filter-no-match\.js["']/);
  assert.match(listFilter, /function updateNoMatchRow\(/);
  assert.match(listFilter, /classList\?\.contains\("list-filter-no-match"\)/);
});
