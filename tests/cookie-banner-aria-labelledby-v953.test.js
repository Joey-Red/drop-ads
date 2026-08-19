import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");
const executor = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("cookie-banner action names support bounded same-root aria-labelledby fallback", () => {
  assert.match(source, /MAX_ARIA_LABELLEDBY_IDS = 4/);
  assert.match(source, /MAX_ARIA_LABELLEDBY_ATTR_CHARS = 256/);
  assert.match(source, /MAX_ARIA_REFERENCE_TEXT_NODES = 16/);
  assert.match(source, /MAX_ARIA_REFERENCE_RAW_CHARS = 256/);
  assert.match(source, /function labelledBySnapshot\(element\)/);
  assert.match(source, /ids\.length > MAX_ARIA_LABELLEDBY_IDS/);
  assert.match(source, /new Set\(ids\)\.size !== ids\.length/);
  assert.match(source, /const target = rootElementById\(root, id\)/);
  assert.match(source, /targetRoot !== root/);
  assert.match(source, /return descendant \|\| labelledBySnapshot\(element\)/);
  assert.match(executor, /ownDataValue\(utils, "textSnapshot"\)/);
  assert.match(executor, /Reflect\.apply\(textSnapshot, undefined, \[element\]\)/);
});
