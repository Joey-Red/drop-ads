import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { MAX_BACKGROUND_RUNTIME_ERROR_CHARS } from "../src/core/runtime.js";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M436 core runtime caught-error text is descriptor-only and bounded", () => {
  assert.equal(MAX_BACKGROUND_RUNTIME_ERROR_CHARS, 1_024);
  assert.match(source, /function backgroundCaughtErrorMessage\(error, fallback\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(error, "message"\)/);
  assert.match(source, /descriptor\.value\.length <= MAX_BACKGROUND_RUNTIME_ERROR_CHARS/);
  assert.doesNotMatch(source, /error instanceof Error \? error\.message/);
});

test("M436 asynchronous core replies use best-effort response delivery", () => {
  assert.match(source, /function sendResponseBestEffort\(sendResponse, payload\)/);
  const directAsyncResponses = source.match(/\.(?:then|catch)\([^\n]*sendResponse\(/g) ?? [];
  assert.deepEqual(directAsyncResponses, []);
  const contained = source.match(/sendResponseBestEffort\(sendResponse,/g) ?? [];
  assert.ok(contained.length >= 10);
});

test("M436 imported source activation errors use the bounded formatter", () => {
  assert.match(source, /function boundedImportActivationError\(error, title\)/);
  assert.match(source, /MAX_BACKGROUND_RUNTIME_ERROR_CHARS - prefix\.length/);
  assert.match(source, /throw new Error\(boundedImportActivationError\(error, subscription\.title\)\)/);
});
