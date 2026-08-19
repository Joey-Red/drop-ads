import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M438 core runtime captures supplied logger callbacks from detached validated options", () => {
  assert.match(source, /function runtimeOptionsSnapshot\(options\) \{/);
  assert.match(source, /const runtimeOptions = runtimeOptionsSnapshot\(options\);/);
  assert.match(source, /function captureRuntimeLogger\(options\) \{/);
  assert.match(source, /const warnField = readPlainDataField\(logger, "warn"\);/);
  assert.match(source, /const errorField = readPlainDataField\(logger, "error"\);/);
  assert.match(source, /warn: bestEffortBoundLogger\(warnField\.value, logger\)/);
  assert.match(source, /error: bestEffortBoundLogger\(errorField\.value, logger\)/);
  assert.match(source, /const logger = captureRuntimeLogger\(runtimeOptions\);/);
});

test("M438 omitted logger preserves best-effort console diagnostics", () => {
  assert.match(source, /warn: bestEffortBoundLogger\(console\.warn, console\)/);
  assert.match(source, /error: bestEffortBoundLogger\(console\.error, console\)/);
  assert.match(source, /function bestEffortBoundLogger\(callback, receiver\)/);
});

test("M438 runtime reporting consumes only the captured local logger record", () => {
  assert.doesNotMatch(source, /options\.logger\.warn/);
  assert.doesNotMatch(source, /options\.logger\.error/);
  assert.match(source, /logger\.warn\("drop-ads list refresh failed; keeping existing rules", error\)/);
  assert.match(source, /logger\.error\("drop-ads failed to repair rules after storage change", error\)/);
});
