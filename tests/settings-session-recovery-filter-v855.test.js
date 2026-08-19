import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const filter = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../src/options/recovery-controls.js", import.meta.url), "utf8");

test("M855 keeps temporary session recovery inside the transient local filter contract", () => {
  assert.match(bootstrap, /import "\.\/session-pauses\.js";/);
  assert.match(filter, /listId: "session-pauses-list", label: "Filter temporary session pauses"/);
  assert.match(filter, /Filters only this Settings page and is not saved\./);
  assert.match(filter, /function isSyntheticPresentationRow\(row\)/);
  assert.match(filter, /if \(isSyntheticPresentationRow\(row\)\) continue;/);
  assert.match(filter, /!isSyntheticPresentationRow\(row\)/);
});
