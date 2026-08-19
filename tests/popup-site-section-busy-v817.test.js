import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../src/popup/popup-busy-semantics.js", import.meta.url), "utf8");

test("M817 mirrors site-control busy state onto the popup site region", () => {
  assert.match(html, /<script type="module" src="popup-busy-semantics\.js"><\/script>/);
  assert.match(source, /document\.querySelector\("#site-section"\)/);
  assert.match(source, /document\.querySelector\("#site-enabled"\)/);
  assert.match(source, /document\.querySelector\("#cookie-site-enabled"\)/);
  assert.match(source, /document\.querySelector\("#pause-site"\)/);
  assert.match(source, /document\.querySelector\("#pick-element"\)/);
  assert.match(source, /control\.getAttribute\("aria-busy"\) === "true"/);
  assert.match(source, /siteSection\.setAttribute\("aria-busy", next\)/);
  assert.match(source, /attributeFilter: \["aria-busy"\]/);
  assert.match(source, /observer\?\.disconnect\(\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|XMLHttpRequest/);
});
