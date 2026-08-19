import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M435 core asynchronous responses are best-effort and bounded", () => {
  assert.match(source, /function sendResponseBestEffort\(sendResponse, payload\)/);
  assert.match(source, /sendResponseBestEffort\(sendResponse, \{ ok: true, result \}\)/);
  assert.match(source, /backgroundCaughtErrorMessage\(error, fallback\)/);
  assert.match(source, /backgroundCaughtErrorMessage\(error, "List refresh failed"\)/);
  assert.match(source, /backgroundCaughtErrorMessage\(error, "Could not import settings"\)/);
  assert.doesNotMatch(source, /error instanceof Error \? error\.message/);
});

test("M435 response delivery contains a throwing or missing response channel", () => {
  assert.match(source, /function sendResponseBestEffort\(sendResponse, payload\) \{/);
  assert.match(source, /try \{ sendResponse\(payload\); \} catch \{/);
});
