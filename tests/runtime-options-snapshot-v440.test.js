import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M440 background runtime options detach before capability work", () => {
  assert.match(source, /function runtimeOptionsSnapshot\(options\)/);
  assert.match(source, /assertPlainExactObject\(options, "Background runtime options", RUNTIME_OPTION_KEYS\);/);
  assert.match(source, /const field = readPlainDataField\(options, key\);/);
  assert.match(source, /return Object\.freeze\(snapshot\);/);
  assert.match(source, /createBackgroundRuntime\(options = \{\}\) \{\s*const runtimeOptions = runtimeOptionsSnapshot\(options\);/s);
});

test("M440 runtime defaults and logger consume the detached option record", () => {
  assert.match(source, /runtimeOptions\.fetchImpl : fetch/);
  assert.match(source, /runtimeOptions\.now : Date\.now/);
  assert.match(source, /captureRuntimeLogger\(runtimeOptions\)/);
});
