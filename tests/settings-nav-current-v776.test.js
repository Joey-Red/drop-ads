import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("Settings nav marks only the current fragment and cleans up listener", () => {
  assert.match(source, /setAttribute\("aria-current", "location"\)/);
  assert.match(source, /removeAttribute\("aria-current"\)/);
  assert.match(source, /addEventListener\("hashchange", updateCurrentSettingsNav\)/);
  assert.match(source, /removeEventListener\("hashchange", updateCurrentSettingsNav\)/);
});
