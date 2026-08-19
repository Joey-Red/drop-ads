import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("popup exposes full site identity and full-height toggle targets", () => {
  assert.match(css, /\.toggle-row \{[^}]*min-height: 44px;/s);
  assert.match(css, /\.site-name \{[^}]*overflow-wrap: anywhere;/s);
  assert.doesNotMatch(css, /\.site-name \{[^}]*white-space: nowrap;/s);
  assert.doesNotMatch(css, /\.site-name \{[^}]*text-overflow: ellipsis;/s);
  assert.match(css, /p \{[^}]*overflow-wrap: anywhere;/s);
});
