import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/options/options.css", import.meta.url), "utf8");

test("compact Settings actions retain the 44px target floor", () => {
  assert.match(css, /\.remove, \.secondary-action \{[^}]*min-height: 44px;/s);
  assert.match(css, /\.inline-check \{[^}]*min-height: 44px;/s);
  assert.match(css, /\.check-row \{[^}]*min-height: 44px;/s);
});
