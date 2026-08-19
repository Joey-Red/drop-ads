import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/options/options.css", import.meta.url), "utf8");

test("Settings reduced-motion mode suppresses future animation and transition motion", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation-duration: \.01ms !important/);
  assert.match(css, /animation-iteration-count: 1 !important/);
  assert.match(css, /transition-duration: \.01ms !important/);
  assert.match(css, /scroll-behavior: auto !important/);
});
