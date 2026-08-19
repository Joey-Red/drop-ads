import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("M874 picker stays intentionally non-modal while exposing Escape recovery", () => {
  assert.match(source, /id="panel" role="dialog" tabindex="-1" aria-keyshortcuts="Escape"/);
  assert.doesNotMatch(source, /aria-modal="true"/);
  assert.match(source, /Escape cancels\./);
  assert.match(source, /Local only\. Drop Ads does not retain page contents/);
});
