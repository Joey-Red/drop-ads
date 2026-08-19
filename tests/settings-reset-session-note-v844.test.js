import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M844 reset exposes the session-separation boundary directly to reset actions", () => {
  assert.match(source, /sessionNote\.id = "reset-settings-session-note"/);
  assert.match(source, /Temporary session pauses are separate ephemeral recovery state and are not cleared by this action/);
  assert.match(source, /button\.setAttribute\("aria-describedby", "reset-settings-help reset-settings-session-note reset-settings-privacy reset-settings-status reset-settings-error"\)/);
  assert.match(source, /confirmButton\.setAttribute\("aria-describedby", "reset-settings-confirmation-text reset-settings-session-note reset-settings-privacy reset-settings-status reset-settings-error"\)/);
  assert.match(source, /does not keep a reset history, browsing history, request history, statistics, identifiers, or telemetry/);
});
