import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/options/options.css", import.meta.url), "utf8");

test("Settings rows can reflow instead of forcing horizontal clipping", () => {
  assert.match(css, /\.input-row, \.subscription-row \{[^}]*flex-wrap: wrap;/s);
  assert.match(css, /select \{[^}]*max-width: 100%;/s);
  assert.match(css, /\.rule-list li > \* \{ min-width: 0; \}/);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*\.input-row \{ flex-direction: column; \}/);
  assert.match(css, /\.input-row input, \.input-row button, select \{ width: 100%; min-width: 0; \}/);
});
