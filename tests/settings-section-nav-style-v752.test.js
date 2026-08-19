import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/options/options.css", import.meta.url), "utf8");

test("Settings jump navigation has keyboard-sized wrapping targets", () => {
  assert.match(css, /\.settings-nav \{[^}]*display: flex;[^}]*flex-wrap: wrap;/s);
  assert.match(css, /\.settings-nav a \{[^}]*min-height: 44px;/s);
  assert.match(css, /\.settings-nav a:focus-visible \{[^}]*outline: 3px solid currentColor;/s);
  assert.match(css, /section\[id\] \{ scroll-margin-top: 20px; \}/);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*\.settings-nav a:focus-visible/);
});
