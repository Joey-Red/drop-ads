import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("confirmed reset declares configured policy surfaces it mutates", () => {
  assert.match(source, /const RESET_TARGETS = "block-list allow-list country-list cosmetic-hide-list cosmetic-allow-list disabled-sites subscription-list cookie-exception-list"/);
  assert.match(source, /confirmButton\.setAttribute\("aria-controls", RESET_TARGETS\)/);
  assert.match(source, /reset-settings-session-note/);
});
