import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M437 background runtime caller options detach before capability work", () => {
  assert.match(source, /function runtimeOptionsSnapshot\(options\)/);
  assert.match(source, /assertPlainExactObject\(options, "Background runtime options", RUNTIME_OPTION_KEYS\);/);
  assert.match(source, /const field = readPlainDataField\(options, key\);/);
  assert.match(source, /return Object\.freeze\(snapshot\);/);
  assert.match(source, /export function createBackgroundRuntime\(options = \{\}\) \{\s*const runtimeOptions = runtimeOptionsSnapshot\(options\);/s);
});

test("M437 defaults and logger capture consume only detached runtime options", () => {
  assert.match(source, /const fetchImpl = Object\.hasOwn\(runtimeOptions, "fetchImpl"\) \? runtimeOptions\.fetchImpl : fetch;/);
  assert.match(source, /const now = Object\.hasOwn\(runtimeOptions, "now"\) \? runtimeOptions\.now : Date\.now;/);
  assert.match(source, /const logger = captureRuntimeLogger\(runtimeOptions\);/);
  assert.doesNotMatch(source, /createBackgroundRuntime[\s\S]*captureRuntimeLogger\(options\)/);
});
