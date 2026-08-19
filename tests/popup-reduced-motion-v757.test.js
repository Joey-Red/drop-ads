import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("popup reduced-motion mode suppresses future animation and transition motion", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\*, \*::before, \*::after \{ animation-duration: \.01ms !important; animation-iteration-count: 1 !important; transition-duration: \.01ms !important; scroll-behavior: auto !important; \}/);
});
