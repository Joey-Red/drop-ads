import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cosmetic-runtime.js", import.meta.url), "utf8");

test("M432 cosmetic runtime uses one best-effort response helper", () => {
  assert.match(source, /function sendResponseBestEffort\(sendResponse, payload\) \{[\s\S]*typeof sendResponse !== "function"[\s\S]*try \{[\s\S]*sendResponse\(payload\);[\s\S]*catch/);
});

test("M432 all cosmetic async message branches route success and failure through contained response delivery", () => {
  const matches = source.match(/sendResponseBestEffort\(sendResponse,/g) ?? [];
  assert.ok(matches.length >= 6);
  assert.doesNotMatch(source, /\.then\([^\n]*=>[^\n]*sendResponse\(/);
  assert.doesNotMatch(source, /\.catch\([^\n]*=>[^\n]*sendResponse\(/);
});
