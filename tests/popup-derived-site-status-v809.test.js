import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("popup semantics explains inactive site states without owning history", () => {
  assert.match(source, /Protection is disabled for this site until you turn it back on\./);
  assert.match(source, /Global blocking is off; this site's saved protection settings remain local/);
  assert.match(source, /sessionStatus\.dataset\.derivedStatus === "true"/);
  assert.match(source, /if \(existing && !ownsCurrentText\) return;/);
  assert.match(source, /observer\.observe\(popupMain,[\s\S]*attributeFilter: \["aria-busy", "disabled", "hidden"\]/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|history\.|indexedDB|telemetry|analytics/i);
  assert.match(html, /<script type="module" src="popup-semantics\.js"><\/script>/);
});
