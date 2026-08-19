import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-keyboard.js", import.meta.url), "utf8");

test("M866 popup keyboard state is page-local and lifecycle owned", () => {
  assert.match(source, /let pageActive = true;/);
  assert.match(source, /window\.addEventListener\("keydown", handlePopupShortcut\);/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.match(source, /pageActive = false;/);
  assert.match(source, /shortcutAvailabilityObserver\?\.disconnect\(\)/);
  assert.match(source, /shortcutAvailabilityObserver = null;/);
  assert.match(source, /window\.removeEventListener\("keydown", handlePopupShortcut\);/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|analytics|telemetry/i);
});
