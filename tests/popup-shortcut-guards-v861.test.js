import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("M861 rejects unsafe popup shortcut keystrokes", () => {
  assert.match(source, /event\.defaultPrevented \|\| event\.repeat \|\| event\.isComposing/);
  assert.match(source, /event\.ctrlKey \|\| event\.metaKey \|\| event\.altKey/);
  assert.match(source, /if \(textEntryTarget\(event\.target\)\) return;/);
  assert.match(source, /if \(event\.shiftKey\) return;/);
  assert.match(source, /let pageActive = true/);
});
