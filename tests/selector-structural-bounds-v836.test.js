import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M836 structural picker fallback is length/depth/sibling bounded and deterministic", () => {
  assert.match(source, /const MAX_SELECTOR_LENGTH = 400/);
  assert.match(source, /const MAX_DEPTH = 5/);
  assert.match(source, /const MAX_SIBLING_SCAN = 10_000/);
  assert.match(source, /if \(!children \|\| !Number\.isSafeInteger\(length\) \|\| length < 0\) throw new Error\("Picker sibling list is invalid"\)/);
  assert.match(source, /if \(length > MAX_SIBLING_SCAN\) throw new Error\(`Picker target has more than \$\{MAX_SIBLING_SCAN\} siblings to inspect safely`\)/);
  assert.match(source, /if \(!position\) throw new Error\("Picker target is no longer attached to its parent"\)/);
  assert.match(source, /return `\$\{base\}:nth-of-type\(\$\{position\}\)`/);
  assert.match(source, /for \(let depth = 0; current && depth < MAX_DEPTH; depth \+= 1\)/);
  assert.match(source, /if \(selector\.length > MAX_SELECTOR_LENGTH\) break/);
});
