import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M851 resumes only the selected temporary session pause through the reviewed runtime transaction", () => {
  assert.match(source, /sendOptionsRuntimeMessage\(api, \{/);
  assert.match(source, /type: "drop-ads:set-session-site-paused"/);
  assert.match(source, /paused: false/);
  assert.match(source, /unwrapOptionsRuntimeResponse\(response, "Could not resume protection for this site"\)/);
  assert.match(source, /resume\.textContent = "Resume protection"/);
  assert.match(source, /Resume protection on \$\{domain\}/);
  assert.match(source, /item\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /Protection resumed for this site\./);
  assert.doesNotMatch(source, /localStorage|indexedDB|fetch\(|sendBeacon|Date\.|performance\.|analytics|telemetry/);
});
