import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M835 bounds picker CSS escape output while it is constructed", () => {
  assert.match(source, /const MAX_SELECTOR_LENGTH = 400;/);
  assert.match(source, /const escaped = safeAscii \? char : `\\\\\$\{code\.toString\(16\)\} `/);
  assert.match(source, /if \(result\.length \+ escaped\.length > MAX_SELECTOR_LENGTH\) throw new Error\(`CSS escape output exceeds \$\{MAX_SELECTOR_LENGTH\} characters`\)/);
  assert.match(source, /result \+= escaped;/);
});
