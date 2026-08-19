import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const runtime = fs.readFileSync(new URL("../src/core/settings-reset-runtime.js", import.meta.url), "utf8");
const response = fs.readFileSync(new URL("../src/core/settings-reset-response.js", import.meta.url), "utf8");

test("M855 configured reset uses a dedicated exact runtime/response boundary", () => {
  assert.match(runtime, /validateSettingsResetMessage\(message\)/);
  assert.match(runtime, /resetConfiguredSettings\(core\)/);
  assert.match(runtime, /sendResponse\(\{ ok: true, result \}\)/);
  assert.match(runtime, /sendResponse\(\{ ok: false, error: "Could not reset configured settings" \}\)/);
  assert.match(response, /exactPlainObject\(response, expectedKeys, "Settings reset response"\)/);
  assert.match(response, /exactPlainObject\(result, \["changed"\], "Settings reset result"\)/);
  assert.match(response, /MAX_RESET_ERROR_CHARS = 1_024/);
  assert.match(response, /return Object\.freeze\(\{ changed: true \}\)/);
});
