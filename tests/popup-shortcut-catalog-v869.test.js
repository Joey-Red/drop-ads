import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/popup/shortcut-catalog.js", import.meta.url), "utf8");

test("M869 popup shortcut catalog is immutable, exact, and privacy-local", () => {
  for (const tuple of [
    ['key: "g"', 'shortcut: "G"', 'controlId: "enabled"'],
    ['key: "s"', 'shortcut: "S"', 'controlId: "site-enabled"'],
    ['key: "p"', 'shortcut: "P"', 'controlId: "pause-site"'],
    ['key: "c"', 'shortcut: "C"', 'controlId: "cookie-site-enabled"'],
    ['key: "e"', 'shortcut: "E"', 'controlId: "pick-element"'],
    ['key: "o"', 'shortcut: "O"', 'controlId: "settings"']
  ]) for (const needle of tuple) assert.match(source, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(source, /Object\.freeze\(RAW_POPUP_SHORTCUTS\.map\(freezeShortcut\)\)/);
  assert.match(source, /Object\.freeze\(POPUP_SHORTCUTS\.map\(\(entry\) => entry\.key\)\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|analytics|telemetry/);
});
