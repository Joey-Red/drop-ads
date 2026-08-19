import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M428 background runtime options are detached through shared field reads once", () => {
  assert.match(source, /function runtimeOptionsSnapshot\(options\) \{/);
  assert.match(source, /assertPlainExactObject\(options, "Background runtime options", RUNTIME_OPTION_KEYS\);/);
  assert.match(source, /const field = readPlainDataField\(options, key\);/);
  assert.match(source, /return Object\.freeze\(snapshot\);/);
  assert.match(source, /const runtimeOptions = runtimeOptionsSnapshot\(options\);/);
  assert.match(source, /const api = runtimeOptions\.api;/);
  assert.match(source, /const fetchImpl = Object\.hasOwn\(runtimeOptions, "fetchImpl"\) \? runtimeOptions\.fetchImpl : fetch;/);
  assert.match(source, /const now = Object\.hasOwn\(runtimeOptions, "now"\) \? runtimeOptions\.now : Date\.now;/);
  assert.match(source, /const logger = captureRuntimeLogger\(runtimeOptions\);/);
});

test("M428 original options are not reread after detached snapshot creation", () => {
  const runtimeStart = source.indexOf("export function createBackgroundRuntime");
  const body = source.slice(runtimeStart, source.indexOf("let started", runtimeStart));
  assert.doesNotMatch(body, /optionValue\(options,/);
  assert.doesNotMatch(body, /Object\.hasOwn\(options,/);
  assert.doesNotMatch(body, /Object\.getOwnPropertyDescriptor\(options,/);
});
