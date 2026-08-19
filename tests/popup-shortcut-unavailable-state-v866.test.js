import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const semantics = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("M866 visible shortcut help marks unavailable controls explicitly from aria-disabled", () => {
  assert.match(semantics, /function shortcutAvailabilityMarker\(row\)/);
  assert.match(semantics, /marker\.className = "shortcut-availability"/);
  assert.match(semantics, /marker\.textContent = "Unavailable"/);
  assert.match(semantics, /const unavailable = row\.getAttribute\("aria-disabled"\) === "true"/);
  assert.match(semantics, /shortcutAvailabilityMarker\(row\)\.hidden = !unavailable/);
  assert.match(semantics, /Unavailable shortcuts are marked below/);
  assert.match(css, /\.shortcut-availability \{[^}]*font-weight: 650;/s);
});
