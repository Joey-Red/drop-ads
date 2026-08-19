import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("M876 picker UI explicitly owns transient observer teardown", () => {
  assert.match(source, /dispose\(\) \{/);
  assert.match(source, /busyObserver\?\.disconnect\(\)/);
  assert.match(source, /busyObserver = null;/);
  assert.match(source, /wasBusy = false;/);
  assert.match(source, /globalThis\.DropAdsPickerUi = Object\.freeze\(\{ create \}\)/);
});
