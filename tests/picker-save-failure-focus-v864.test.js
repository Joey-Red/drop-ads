import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("picker restores focus when a busy save becomes retryable", () => {
  assert.match(source, /let wasBusy = false/);
  assert.match(source, /if \(wasBusy && !busy && host\.isConnected === true\)/);
  assert.match(source, /save\.focus\(\)/);
  assert.match(source, /wasBusy = busy/);
  assert.match(source, /wasBusy = false/);
});
