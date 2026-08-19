import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("background runtime options are detached once before collaborator setup", () => {
  assert.match(source, /function runtimeOptionsSnapshot\(options\)/);
  assert.match(source, /assertPlainExactObject\(options, "Background runtime options", RUNTIME_OPTION_KEYS\)/);
  assert.match(source, /readPlainDataField\(options, key\)/);
  assert.match(source, /const runtimeOptions = runtimeOptionsSnapshot\(options\);/);
  assert.match(source, /const api = runtimeOptions\.api;/);
  assert.match(source, /captureRuntimeLogger\(runtimeOptions\)/);
  assert.doesNotMatch(source, /createBackgroundRuntime\(options = \{\}\)[\s\S]{0,500}optionValue\(options, "api"\)/);
});

test("runtime option defaults are applied only after snapshotting", () => {
  assert.match(source, /Object\.hasOwn\(runtimeOptions, "fetchImpl"\) \? runtimeOptions\.fetchImpl : fetch/);
  assert.match(source, /Object\.hasOwn\(runtimeOptions, "now"\) \? runtimeOptions\.now : Date\.now/);
});
