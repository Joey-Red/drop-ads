import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("import guard constructs frozen bounded failure envelopes", () => {
  const source = read("src/core/import-guard.js");
  assert.match(source, /function importGuardFailurePayload\(error\)/);
  assert.match(source, /Object\.freeze\(\{ ok: false, error: importGuardFailureMessage\(error\) \}\)/);
  assert.match(source, /MAX_IMPORT_GUARD_ERROR_CHARS = 1_024/);
  assert.doesNotMatch(source, /sendResponseBestEffort\(sendResponse, \{ ok: false/);
});
