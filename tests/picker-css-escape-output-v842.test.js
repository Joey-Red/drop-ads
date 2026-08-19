import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M842 CSS escaping fails closed before escaped output exceeds the selector ceiling", () => {
  assert.match(source, /const MAX_SELECTOR_LENGTH = 400;/);
  assert.match(source, /if \(value\.length > MAX_SELECTOR_LENGTH\) throw new Error/);
  assert.match(source, /const escaped = safeAscii \? char : `\\\\\$\{code\.toString\(16\)\} `;/);
  assert.match(source, /if \(result\.length \+ escaped\.length > MAX_SELECTOR_LENGTH\) throw new Error/);
});
