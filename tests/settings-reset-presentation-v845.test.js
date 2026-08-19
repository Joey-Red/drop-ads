import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const css = fs.readFileSync(new URL("../src/options/options.css", import.meta.url), "utf8");

test("M845 reset confirmation stays resilient across narrow and contrast modes", () => {
  assert.match(css, /\.reset-session-note \{[^}]*border-left: 3px solid currentColor;/s);
  assert.match(css, /\.reset-confirmation \{[^}]*max-width: 760px;[^}]*border:/s);
  assert.match(css, /\.reset-confirmation-actions \{[^}]*display: flex;[^}]*flex-wrap: wrap;/s);
  assert.match(css, /#confirm-reset-settings \{ font-weight: 700; \}/);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*\.reset-confirmation-actions \{ flex-direction: column; \}[\s\S]*\.reset-confirmation-actions button \{ width: 100%; \}/);
  assert.match(css, /@media \(prefers-contrast: more\)[\s\S]*\.reset-session-note/);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*\.reset-session-note \{ border-left-color: Highlight; \}/);
});
