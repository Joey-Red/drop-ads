import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("M872 picker busy state tracks save retryability and restores focus", () => {
  assert.match(source, /const busy = save\.disabled === true;/);
  assert.match(source, /panel\.setAttribute\("aria-busy", busy \? "true" : "false"\)/);
  assert.match(source, /if \(wasBusy && !busy && host\.isConnected === true\)/);
  assert.match(source, /save\.focus\(\)/);
  assert.match(source, /busyObserver\.observe\(save, \{ attributes: true, attributeFilter: \["disabled"\] \}\)/);
});
