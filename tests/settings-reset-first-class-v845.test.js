import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M845 configured reset is a first-class ordered Settings destination", () => {
  assert.match(source, /section\.id = "reset-settings-section"/);
  assert.match(source, /section\.setAttribute\("aria-labelledby", "reset-settings-heading"\)/);
  assert.match(source, /link\.href = "#reset-settings-section"/);
  assert.match(source, /const backupLink = settingsNav\.querySelector\('a\[href="#backup-settings"\]'\)/);
  assert.match(source, /if \(backupLink\) backupLink\.after\(link\)/);
  assert.match(source, /backupSection\.insertAdjacentElement\("afterend", section\)/);
});
