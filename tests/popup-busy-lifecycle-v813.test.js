import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("popup busy accounting is lifecycle safe", () => {
  assert.match(source, /if \(!pageActive\) return \(\) => undefined;/);
  assert.match(source, /if \(released\) return;\n    released = true;\n    if \(!pageActive\) return;/);
  assert.match(source, /pendingMutations = Math\.max\(0, pendingMutations - 1\);/);
  assert.match(source, /if \(control\?\.isConnected\) control\.removeAttribute\("aria-busy"\);/);
  assert.match(source, /if \(pageActive && settings\.isConnected\) settings\.disabled = false;/);
});
