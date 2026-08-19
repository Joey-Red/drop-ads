import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("popup explains inactive protection states without persistent tracking", () => {
  assert.match(source, /Protection is disabled for this site until you turn it back on\./);
  assert.match(source, /Protection is paused for this browser session only\./);
  assert.match(source, /Global blocking is off; this site's saved protection settings remain local/);
  assert.match(source, /popupMain\?\.getAttribute\("aria-busy"\) === "true"/);
  assert.match(source, /if \(existing && !ownsCurrentText\) return;/);
  assert.doesNotMatch(source, /storage\.|localStorage|sessionStorage|fetch\(/);
});
