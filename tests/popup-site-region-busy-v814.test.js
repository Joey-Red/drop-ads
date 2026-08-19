import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-busy-semantics.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("M814 site-specific busy controls publish one scoped popup region state", () => {
  assert.match(html, /<script type="module" src="popup-busy-semantics\.js"><\/script>/);
  assert.match(source, /const siteControls = \[/);
  assert.match(source, /document\.querySelector\("#site-enabled"\)/);
  assert.match(source, /document\.querySelector\("#cookie-site-enabled"\)/);
  assert.match(source, /document\.querySelector\("#pause-site"\)/);
  assert.match(source, /document\.querySelector\("#pick-element"\)/);
  assert.match(source, /siteControls\.some\(\(control\) => control\.getAttribute\("aria-busy"\) === "true"\)/);
  assert.match(source, /if \(siteSection\.getAttribute\("aria-busy"\) !== next\) siteSection\.setAttribute\("aria-busy", next\)/);
  assert.match(source, /observer\.observe\(control, \{ attributes: true, attributeFilter: \["aria-busy"\] \}\)/);
  assert.match(source, /observer\?\.disconnect\(\)/);
});
