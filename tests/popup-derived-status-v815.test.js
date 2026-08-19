import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("popup idle status is derived locally without overwriting active feedback", () => {
  assert.match(source, /Protection is disabled for this site until you turn it back on\./);
  assert.match(source, /Protection is paused for this browser session only\./);
  assert.match(source, /Global blocking is off; this site's saved protection settings remain local/);
  assert.match(source, /Cookie protection is disabled for this site by a local exception\./);
  assert.match(source, /const ownsCurrentText = sessionStatus\.dataset\.derivedStatus === "true";/);
  assert.match(source, /if \(existing && !ownsCurrentText\) return;/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(/);
});
