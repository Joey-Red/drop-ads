import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/options/options.css", import.meta.url), "utf8");

test("M855 exposes an explicit local configured-settings reset confirmation", () => {
  assert.match(source, /Reset configured settings/);
  assert.match(source, /Temporary session pauses are separate ephemeral recovery state and are not cleared/);
  assert.match(source, /does not keep a reset history, browsing history, request history, statistics, identifiers, or telemetry/);
  assert.match(source, /aria-controls", "reset-settings-confirmation/);
  assert.match(source, /confirmation\.setAttribute\("role", "group"\)/);
  assert.match(source, /confirmButton\.textContent = "Confirm reset"/);
  assert.match(source, /cancelButton\.textContent = "Cancel"/);
  assert.match(css, /\.reset-confirmation/);
  assert.match(css, /\.reset-confirmation-actions/);
});
