import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../src/popup/popup-busy-semantics.js", import.meta.url), "utf8");

test("popup site region mirrors site-specific control busy state", () => {
  assert.match(html, /<script type="module" src="popup-busy-semantics\.js"><\/script>/);
  assert.match(source, /function syncSiteSectionBusy\(\)/);
  assert.match(source, /siteControls\.some\(\(control\) => control\.getAttribute\("aria-busy"\) === "true"\)/);
  assert.match(source, /if \(siteSection\.getAttribute\("aria-busy"\) !== next\) siteSection\.setAttribute\("aria-busy", next\)/);
  assert.match(source, /observer\.observe\(control, \{ attributes: true, attributeFilter: \["aria-busy"\] \}\)/);
  assert.match(source, /observer\?\.disconnect\(\)/);
});
