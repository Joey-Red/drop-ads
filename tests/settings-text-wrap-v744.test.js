import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/options/options.css", import.meta.url), "utf8");

test("Settings long labels and user-controlled display text may wrap", () => {
  assert.match(css, /h1, h2, label, button, \.lede, \.hint, \.rule-note, \.check-row span, \.subscription-list strong, \.subscription-list code \{ overflow-wrap: anywhere; \}/);
  assert.match(css, /\.rule-list code \{ overflow-wrap: anywhere;/);
});
