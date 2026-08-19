import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { MAX_BACKGROUND_RUNTIME_ERROR_CHARS } from "../src/core/runtime.js";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M435 background runtime failures use the reviewed 1,024-character ceiling", () => {
  assert.equal(MAX_BACKGROUND_RUNTIME_ERROR_CHARS, 1024);
  assert.match(source, /function backgroundCaughtErrorMessage\(error, fallback\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(error, "message"\)/);
  assert.match(source, /descriptor && "value" in descriptor && typeof descriptor\.value === "string"/);
  assert.match(source, /descriptor\.value\.length <= MAX_BACKGROUND_RUNTIME_ERROR_CHARS/);
  assert.doesNotMatch(source, /error instanceof Error \? error\.message/);
});

test("M435 import activation composes bounded detail without normal error-message reads", () => {
  assert.match(source, /function boundedImportActivationError\(error, title\)/);
  assert.match(source, /MAX_BACKGROUND_RUNTIME_ERROR_CHARS - prefix\.length/);
  assert.match(source, /throw new Error\(boundedImportActivationError\(error, subscription\.title\)\)/);
});
