import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");
assert.match(source, /Backup file selected and ready to import\./);
assert.match(source, /if \(backupError\) backupError\.textContent = ""/);
assert.match(source, /backupStatusObserver\.observe\(backupStatus, \{ childList: true, characterData: true, subtree: true \}\)/);
assert.doesNotMatch(source, /files\?\.\[0\]\?\.name|\.name.*Backup file selected/);
