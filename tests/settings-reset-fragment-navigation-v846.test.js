import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M846 dynamically created Reset section honors an initial fragment destination", () => {
  assert.match(source, /function ensureResetNavLink\(\)[\s\S]*return link;/);
  assert.match(source, /globalThis\.location\?\.hash !== "#reset-settings-section"/);
  assert.match(source, /link\?\.setAttribute\("aria-current", "location"\)/);
  assert.match(source, /heading\.tabIndex = -1/);
  assert.match(source, /heading\.classList\.add\("jump-focus-target"\)/);
  assert.match(source, /heading\.focus\(\)/);
  assert.match(source, /synchronizeInitialResetFragment\(section, link\)/);
});
