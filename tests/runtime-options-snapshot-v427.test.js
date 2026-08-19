import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M427 background runtime options are detached once through shared field reads", () => {
  assert.match(source, /function runtimeOptionsSnapshot\(options\)/);
  assert.match(source, /assertPlainExactObject\(options, "Background runtime options", RUNTIME_OPTION_KEYS\)/);
  assert.match(source, /readPlainDataField\(options, key\)/);
  assert.match(source, /const runtimeOptions = runtimeOptionsSnapshot\(options\);/);
  assert.match(source, /captureRuntimeLogger\(runtimeOptions\)/);
  assert.doesNotMatch(source, /const api = optionValue\(options, "api"\)/);
  assert.doesNotMatch(source, /Object\.hasOwn\(options, "fetchImpl"\)/);
  assert.doesNotMatch(source, /Object\.hasOwn\(options, "now"\)/);
});
