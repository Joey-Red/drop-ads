import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("M809 popup inactive-state explanations stay local and preserve transaction feedback", () => {
  assert.match(source, /Protection is disabled for this site until you turn it back on\./);
  assert.match(source, /Protection is paused for this browser session only\./);
  assert.match(source, /Global blocking is off; this site's saved protection settings remain local/);
  assert.match(source, /if \(existing && !ownsCurrentText\) return;/);
  assert.match(source, /popupMain\?\.getAttribute\("aria-busy"\) === "true"/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|storage\.|fetch\(|XMLHttpRequest/);
});
