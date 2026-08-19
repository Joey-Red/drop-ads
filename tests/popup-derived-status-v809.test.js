import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("popup derived idle status is local, non-destructive, and lifecycle-owned", () => {
  assert.match(html, /<script type="module" src="popup-semantics\.js"><\/script>/);
  assert.match(source, /Protection is disabled for this site until you turn it back on\./);
  assert.match(source, /Protection is paused for this browser session only\./);
  assert.match(source, /Global blocking is off; this site's saved protection settings remain local/);
  assert.match(source, /Cookie protection is disabled for this site by a local exception\./);
  assert.match(source, /if \(existing && !ownsCurrentText\) return;/);
  assert.match(source, /popupMain\?\.getAttribute\("aria-busy"\) === "true"/);
  assert.match(source, /pageActive = false/);
  assert.match(source, /observer\?\.disconnect\(\)/);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|telemetry|analytics/i);
});
