import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("picker CSS escaping bounds final expanded output", () => {
  assert.match(source, /const MAX_SELECTOR_LENGTH = 400;/);
  assert.match(source, /const escaped = safeAscii \? char :/);
  assert.match(source, /result\.length \+ escaped\.length > MAX_SELECTOR_LENGTH/);
  assert.match(source, /CSS escape output exceeds/);
  assert.match(source, /result \+= escaped;/);
});
