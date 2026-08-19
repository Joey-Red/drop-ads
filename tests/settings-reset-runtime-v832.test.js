import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const runtime = fs.readFileSync(new URL("../src/core/settings-reset-runtime.js", import.meta.url), "utf8");
const background = fs.readFileSync(new URL("../src/background.js", import.meta.url), "utf8");

test("configured reset is partitioned from the ordinary core message guard", () => {
  assert.match(runtime, /ownResetType\(message\) \? false : listener/);
  assert.match(runtime, /validateSettingsResetMessage\(message\)/);
  assert.match(runtime, /resetConfiguredSettings\(core\)/);
  assert.match(runtime, /event\.removeListener\(listener\)/);
  assert.match(background, /createMessageGuardedApi\(createResetPartitionedApi\(api\), \{ group: "core" \}\)/);
  assert.match(background, /name: "settings-reset"/);
  assert.match(background, /installSettingsResetRuntime\(\{ api, core: runtime \}\)/);
});
