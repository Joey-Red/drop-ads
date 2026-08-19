import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("M861 ignores unsafe or editing keyboard contexts", () => {
  assert.match(source, /event\.defaultPrevented \|\| event\.repeat \|\| event\.isComposing/);
  assert.match(source, /event\.ctrlKey \|\| event\.metaKey \|\| event\.altKey/);
  assert.match(source, /if \(textEntryTarget\(event\.target\)\) return/);
  assert.match(source, /target\.closest\("\[contenteditable=\\"true\\"\]"\)/);
  assert.match(source, /target\.matches\("textarea, select"\)/);
  assert.match(source, /if \(event\.shiftKey\) return/);
});
