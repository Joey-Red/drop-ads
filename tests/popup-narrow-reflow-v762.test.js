import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("popup uses a smaller hard width floor and compact narrow reflow", () => {
  assert.match(css, /body \{[^}]*min-width: 320px;/s);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*main \{ padding: 14px; \}/);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*header, \.toggle-row \{ gap: 10px; \}/);
});

test("popup narrow reflow preserves 44px primary action targets", () => {
  assert.match(css, /button \{[^}]*min-height: 44px;/s);
  assert.match(css, /\.toggle-row \{[^}]*min-height: 44px;/s);
});
