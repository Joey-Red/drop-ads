import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("shortcut help summarizes current availability without echoing site identity", () => {
  assert.match(source, /function syncShortcutHelpNote\(\)/);
  assert.match(source, /Unavailable shortcuts are marked below\. Site shortcuts require an HTTP\(S\) page/);
  assert.match(source, /All listed shortcuts are currently available while this popup is open\./);
  assert.match(source, /syncShortcutHelpNote\(\);/);
  assert.doesNotMatch(source, /shortcutHelpNote\.textContent = .*siteName/);
});
