import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("popup explains local cookie exceptions without overriding stronger states", () => {
  const disabled = source.indexOf("Protection is disabled for this site until you turn it back on.");
  const paused = source.indexOf("Protection is paused for this browser session only.");
  const globalOff = source.indexOf("Global blocking is off; this site's saved protection settings remain local");
  const cookie = source.indexOf("Cookie protection is disabled for this site by a local exception.");
  assert.ok(disabled >= 0 && paused > disabled && globalOff > paused && cookie > globalOff);
  assert.match(source, /if \(existing && !ownsCurrentText\) return;/);
  assert.match(source, /popupMain\?\.getAttribute\("aria-busy"\) === "true"/);
});
